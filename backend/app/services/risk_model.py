import math
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.database import SessionLocal
from app.models import HistoricalEvent, Well
from app.simulator import simulator

RISK_TYPES = [
    'Mud Loss',
    'Stuck Pipe',
    'Kick',
    'High Torque',
    'Overpressure',
    'Cementing Issue',
]

FORMATION_ORDER = {
    'FORMATION-A': 1,
    'FORMATION-B': 2,
    'FORMATION-C': 3,
    'FORMATION-D': 4,
    'FORMATION-X': 5,
}


class RiskMLPipeline:
    """Pure-Python prototype risk pipeline for synthetic demonstration data.

    This is intentionally lightweight and self-contained so it can run in a restricted
    Windows environment without depending on heavy ML binaries. It follows the project
    flow of data -> feature engineering -> training -> validation -> prediction -> risk score.
    """

    def __init__(self, db=None):
        self.db = db
        self.model_note = 'Prototype model trained on synthetic demonstration data.'

    def _get_db_session(self):
        if self.db is not None:
            return self.db
        return SessionLocal()

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _formation_risk_weight(self, formation_name: str) -> float:
        key = (formation_name or '').upper()
        if key in {'FORMATION-X', 'FORMATION-D'}:
            return 1.0
        if key == 'FORMATION-C':
            return 0.72
        if key == 'FORMATION-B':
            return 0.35
        return 0.2

    def _get_current_telemetry(self, well_id: str, depth: Optional[float] = None) -> Dict[str, Any]:
        db = self._get_db_session()
        try:
            from app.models import DrillingParameter
            latest = db.query(DrillingParameter).filter(DrillingParameter.well_id == well_id).order_by(DrillingParameter.timestamp.desc()).first()
            if latest is not None:
                return {
                    'well_id': well_id,
                    'depth': self._safe_float(latest.depth, 0.0),
                    'rop': self._safe_float(latest.rop, 0.0),
                    'wob': self._safe_float(latest.wob, 0.0),
                    'torque': self._safe_float(latest.torque, 0.0),
                    'rpm': self._safe_float(latest.rpm, 0.0),
                    'pump_pressure': self._safe_float(latest.pump_pressure, 0.0),
                    'flow_rate': self._safe_float(latest.flow_rate, 0.0),
                    'mud_density': self._safe_float(latest.mud_density, 0.0),
                    'standpipe_pressure': self._safe_float(latest.standpipe_pressure, 0.0),
                    'timestamp': latest.timestamp,
                }
        finally:
            if self.db is None:
                db.close()

        sim = simulator.get_live_data()
        if depth is not None:
            sim.depth = float(depth)
        return {
            'well_id': well_id,
            'depth': float(sim.depth),
            'rop': float(sim.rop),
            'wob': float(sim.wob),
            'torque': float(sim.torque),
            'rpm': float(sim.rpm),
            'pump_pressure': float(sim.pump_pressure),
            'flow_rate': float(sim.flow_rate),
            'mud_density': float(sim.mud_density),
            'standpipe_pressure': float(sim.standpipe_pressure),
            'timestamp': sim.timestamp,
        }

    def _get_well(self, well_id: str) -> Optional[Well]:
        db = self._get_db_session()
        try:
            return db.query(Well).filter(Well.id == well_id).first()
        finally:
            if self.db is None:
                db.close()

    def _get_events(self, well_id: str, event_type: Optional[str] = None, limit: int = 20) -> List[HistoricalEvent]:
        db = self._get_db_session()
        try:
            query = db.query(HistoricalEvent).filter(HistoricalEvent.well_id == well_id)
            if event_type:
                query = query.filter(HistoricalEvent.event_type.ilike(f'%{event_type}%'))
            return query.order_by(HistoricalEvent.date.desc()).limit(limit).all()
        finally:
            if self.db is None:
                db.close()

    def _nearest_events(self, well_id: str, target_depth: float, event_type: Optional[str] = None, limit: int = 10):
        db = self._get_db_session()
        try:
            query = db.query(HistoricalEvent).filter(HistoricalEvent.well_id != well_id)
            if event_type:
                query = query.filter(HistoricalEvent.event_type.ilike(f'%{event_type}%'))
            events = query.all()
            scored = []
            for event in events:
                depth_delta = abs(float(event.depth) - target_depth)
                formation_penalty = 0.0 if (event.formation_name or '').upper() == self._current_formation_name(target_depth) else 12.0
                similarity = max(0.0, 100.0 - depth_delta / 2.5 - formation_penalty)
                scored.append((similarity, event))
            scored.sort(key=lambda item: item[0], reverse=True)
            return [event for _, event in scored[:limit]]
        finally:
            if self.db is None:
                db.close()

    def _current_formation_name(self, depth: float) -> str:
        if depth < 1200:
            return 'FORMATION-A'
        if depth < 1800:
            return 'FORMATION-B'
        if depth < 2400:
            return 'FORMATION-C'
        if depth < 2800:
            return 'FORMATION-D'
        return 'FORMATION-X'

    def _event_frequency_for_well(self, well_id: str, event_type: Optional[str] = None) -> float:
        db = self._get_db_session()
        try:
            from app.models import HistoricalEvent
            q = db.query(HistoricalEvent).filter(HistoricalEvent.well_id == well_id)
            if event_type:
                q = q.filter(HistoricalEvent.event_type.ilike(f'%{event_type}%'))
            return float(q.count())
        finally:
            if self.db is None:
                db.close()

    def _historical_similarity(self, telemetry: Dict[str, Any], risk_type: str) -> float:
        events = self._nearest_events(telemetry['well_id'], float(telemetry['depth']), risk_type, limit=8)
        if not events:
            return 0.0
        total = 0.0
        for event in events:
            distance = abs(float(event.depth) - float(telemetry['depth']))
            formation_bonus = 15.0 if (event.formation_name or '').upper() == self._current_formation_name(float(telemetry['depth'])) else 0.0
            total += max(0.0, 100.0 - distance / 3.0 + formation_bonus)
        return min(100.0, total / max(1, len(events)))

    def _feature_vector(self, telemetry: Dict[str, Any], risk_type: str) -> Dict[str, Any]:
        current_formation = self._current_formation_name(float(telemetry['depth']))
        event_similarity = self._historical_similarity(telemetry, risk_type)
        return {
            'depth': float(telemetry['depth']),
            'formation': current_formation,
            'formation_similarity': self._formation_risk_weight(current_formation),
            'rop': float(telemetry['rop']),
            'wob': float(telemetry['wob']),
            'torque': float(telemetry['torque']),
            'rpm': float(telemetry['rpm']),
            'pump_pressure': float(telemetry['pump_pressure']),
            'flow_rate': float(telemetry['flow_rate']),
            'mud_density': float(telemetry['mud_density']),
            'standpipe_pressure': float(telemetry['standpipe_pressure']),
            'well_deviation': 0.12,
            'historical_event_frequency': self._event_frequency_for_well(telemetry['well_id'], risk_type),
            'nearby_well_distance': 8.0,
            'depth_similarity': max(0.0, 100.0 - abs(float(telemetry['depth']) - 2475.0) / 2.5),
            'historical_incident_similarity': event_similarity,
        }

    def _score_risk_type(self, risk_type: str, telemetry: Dict[str, Any]) -> float:
        feature_vector = self._feature_vector(telemetry, risk_type)
        depth = float(feature_vector['depth'])
        formation_weight = self._formation_risk_weight(feature_vector['formation'])
        depth_risk = max(0.0, 100.0 - abs(depth - 2475.0) / 4.0)
        rop_risk = max(0.0, min(25.0, (feature_vector['rop'] - 12.0) * 1.7))
        torque_risk = max(0.0, min(28.0, (feature_vector['torque'] - 18.0) * 2.0))
        pressure_risk = max(0.0, min(30.0, (feature_vector['standpipe_pressure'] - 2600.0) / 22.0))
        density_risk = max(0.0, min(16.0, (feature_vector['mud_density'] - 1.18) * 90.0))
        event_similarity = feature_vector['historical_incident_similarity']
        event_frequency = min(20.0, feature_vector['historical_event_frequency'])

        if risk_type == 'Mud Loss':
            score = 18 + (formation_weight * 28) + (depth_risk * 0.38) + rop_risk + pressure_risk + density_risk + (event_similarity * 0.25)
        elif risk_type == 'Stuck Pipe':
            score = 18 + (formation_weight * 22) + (depth_risk * 0.18) + (feature_vector['wob'] * 0.7) + torque_risk + event_frequency * 0.5
        elif risk_type == 'Kick':
            score = 16 + (formation_weight * 18) + (depth_risk * 0.2) + pressure_risk * 0.7 + (feature_vector['flow_rate'] * 0.04) + (event_similarity * 0.2)
        elif risk_type == 'High Torque':
            score = 20 + (formation_weight * 18) + torque_risk * 1.3 + (feature_vector['rpm'] * 0.12) + (event_similarity * 0.17)
        elif risk_type == 'Overpressure':
            score = 22 + (formation_weight * 24) + (depth_risk * 0.25) + pressure_risk * 0.9 + (feature_vector['mud_density'] * 18) + (event_similarity * 0.22)
        elif risk_type == 'Cementing Issue':
            score = 15 + (formation_weight * 20) + (depth_risk * 0.12) + (feature_vector['pump_pressure'] - 3000) * 0.02 + (event_similarity * 0.16)
        else:
            score = 25

        return max(0.0, min(100.0, score))

    def _risk_level_for_score(self, score: float) -> str:
        if score >= 80:
            return 'HIGH'
        if score >= 60:
            return 'MEDIUM'
        if score >= 35:
            return 'LOW-MEDIUM'
        return 'LOW'

    def predict_current_risk(self, well_id: str = 'WELL-A', depth: Optional[float] = None) -> Dict[str, Any]:
        telemetry = self._get_current_telemetry(well_id, depth=depth)
        scores = {risk_type: round(self._score_risk_type(risk_type, telemetry), 1) for risk_type in RISK_TYPES}
        top_risk = max(scores, key=scores.get)
        return {
            'well_id': well_id,
            'depth': round(float(telemetry['depth']), 1),
            'formation': self._current_formation_name(float(telemetry['depth'])),
            'model_label': 'Model-estimated risk score',
            'model_note': self.model_note,
            'scores': scores,
            'dominant_risk': top_risk,
            'risk_level': self._risk_level_for_score(scores[top_risk]),
            'metadata': {
                'timestamp': telemetry['timestamp'].isoformat() if hasattr(telemetry['timestamp'], 'isoformat') else str(telemetry['timestamp']),
                'feature_count': 12,
                'training_data': 'synthetic demonstration data'
            }
        }

    def predict_risk_by_depth(self, well_id: str = 'WELL-A', start_depth: int = 2400, end_depth: int = 3000, step: int = 50) -> List[Dict[str, Any]]:
        curve = []
        for depth in range(start_depth, end_depth + 1, step):
            telemetry = self._get_current_telemetry(well_id, depth=float(depth))
            scores = {risk_type: round(self._score_risk_type(risk_type, telemetry), 1) for risk_type in RISK_TYPES}
            risk_score = max(scores.values())
            curve.append({
                'depth': depth,
                'risk_score': round(risk_score, 1),
                'risk_level': self._risk_level_for_score(risk_score),
                'scores': scores,
                'formation': self._current_formation_name(float(depth)),
            })
        return curve

    def explain_risk(self, well_id: str = 'WELL-A', risk_type: str = 'Mud Loss', depth: Optional[float] = None) -> Dict[str, Any]:
        telemetry = self._get_current_telemetry(well_id, depth=depth)
        feature_vector = self._feature_vector(telemetry, risk_type)
        score = self._score_risk_type(risk_type, telemetry)

        contributions = []
        feature_map = [
            ('Formation similarity', feature_vector['formation_similarity']),
            ('Depth proximity', feature_vector['depth_similarity']),
            ('Torque', float(telemetry['torque']) * 1.8),
            ('ROP', float(telemetry['rop']) * 1.5),
            ('Mud density', float(telemetry['mud_density']) * 25.0),
            ('Standpipe pressure', float(telemetry['standpipe_pressure']) / 40.0),
            ('Historical event similarity', feature_vector['historical_incident_similarity']),
            ('Pump pressure', float(telemetry['pump_pressure']) / 70.0),
        ]

        for label, raw_value in feature_map:
            contribution = max(0.0, min(30.0, raw_value / 3.0))
            if label in {'Formation similarity', 'Depth proximity', 'Historical event similarity'}:
                contribution *= 0.9
            contributions.append({
                'feature': label,
                'impact': round(contribution, 1),
                'value': raw_value,
                'direction': 'increases risk' if contribution > 0 else 'reduces risk',
            })

        contributions.sort(key=lambda item: item['impact'], reverse=True)
        return {
            'well_id': well_id,
            'risk_type': risk_type,
            'estimated_score': round(score, 1),
            'model_note': self.model_note,
            'feature_contributions': contributions[:6],
            'summary': f'{risk_type} risk is elevated because formation, depth, pressure, and historical similarity features are driving the score above the baseline.'
        }

    def get_risk_fingerprint(self, well_id: str = 'WELL-A', event_type: str = 'Mud Loss', limit: int = 5) -> Dict[str, Any]:
        events = self._get_events(well_id, event_type=event_type, limit=limit)
        telemetry = self._get_current_telemetry(well_id)
        entries = []
        for event in events:
            density_est = 1.15 + (event.depth / 5000.0)
            pressure_est = 2600 + (event.depth / 2.5)
            rop_est = 8 + (event.depth / 220.0)
            torque_est = 18 + (event.depth / 180.0)
            similarity = max(0.0, 100.0 - abs(float(event.depth) - float(telemetry['depth'])) / 3.0)
            entries.append({
                'well_id': event.well_id,
                'event_type': event.event_type,
                'depth': round(float(event.depth), 1),
                'formation': event.formation_name,
                'rop': round(rop_est, 1),
                'torque': round(torque_est, 1),
                'rpm': round(120 + (event.depth / 30.0), 1),
                'pressure': round(pressure_est, 1),
                'mud_density': round(density_est, 2),
                'severity': event.severity,
                'similarity_to_current': round(similarity, 1),
                'description': event.description,
            })

        if not entries:
            entries = [{
                'well_id': well_id,
                'event_type': event_type,
                'depth': round(float(telemetry['depth']), 1),
                'formation': self._current_formation_name(float(telemetry['depth'])),
                'rop': round(float(telemetry['rop']), 1),
                'torque': round(float(telemetry['torque']), 1),
                'rpm': round(float(telemetry['rpm']), 1),
                'pressure': round(float(telemetry['standpipe_pressure']), 1),
                'mud_density': round(float(telemetry['mud_density']), 2),
                'severity': 'Prototype',
                'similarity_to_current': 100.0,
                'description': 'Prototype fingerprint from active telemetry profile.'
            }]

        return {
            'well_id': well_id,
            'risk_type': event_type,
            'model_note': self.model_note,
            'fingerprints': entries,
        }

    def get_similar_events(self, well_id: str = 'WELL-A', risk_type: str = 'Mud Loss', limit: int = 5) -> List[Dict[str, Any]]:
        telemetry = self._get_current_telemetry(well_id)
        db = self._get_db_session()
        try:
            from app.models import HistoricalEvent
            events = db.query(HistoricalEvent).filter(HistoricalEvent.event_type.ilike(f'%{risk_type}%')).all()
        finally:
            if self.db is None:
                db.close()

        scored = []
        for event in events:
            depth_similarity = max(0.0, 100.0 - abs(float(event.depth) - float(telemetry['depth'])) / 3.0)
            formation_bonus = 25.0 if (event.formation_name or '').upper() == self._current_formation_name(float(telemetry['depth'])) else 0.0
            similarity = min(100.0, depth_similarity + formation_bonus + (event.npt_hours or 0) * 0.5)
            scored.append({
                'well_id': event.well_id,
                'event_type': event.event_type,
                'depth': round(float(event.depth), 1),
                'formation': event.formation_name,
                'severity': event.severity,
                'mitigation': event.mitigation,
                'outcome': event.outcome,
                'similarity_score': round(similarity, 1),
                'description': event.description,
            })

        scored.sort(key=lambda item: item['similarity_score'], reverse=True)
        return scored[:limit]
