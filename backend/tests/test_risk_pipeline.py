import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.risk_model import RiskMLPipeline


class RiskPipelineTests(unittest.TestCase):
    def setUp(self):
        self.pipeline = RiskMLPipeline()

    def test_current_risk_has_required_types(self):
        result = self.pipeline.predict_current_risk(well_id='WELL-A')
        self.assertIn('scores', result)
        for risk_type in ['Mud Loss', 'Stuck Pipe', 'Kick', 'High Torque', 'Overpressure', 'Cementing Issue']:
            self.assertIn(risk_type, result['scores'])
            self.assertGreaterEqual(result['scores'][risk_type], 0)
            self.assertLessEqual(result['scores'][risk_type], 100)
        self.assertIn('model_note', result)
        self.assertIn('synthetic demonstration data', result['model_note'].lower())

    def test_depth_predictions_cover_target_ranges(self):
        depth_curve = self.pipeline.predict_risk_by_depth(well_id='WELL-A', start_depth=2400, end_depth=2600, step=50)
        self.assertGreater(len(depth_curve), 0)
        self.assertTrue(all(item['risk_score'] >= 0 for item in depth_curve))
        self.assertTrue(all(item['risk_score'] <= 100 for item in depth_curve))

    def test_explainability_lists_feature_contributions(self):
        explanation = self.pipeline.explain_risk(well_id='WELL-A', risk_type='Mud Loss')
        self.assertIn('feature_contributions', explanation)
        self.assertGreater(len(explanation['feature_contributions']), 0)

    def test_api_has_current_and_fingerprint_endpoints(self):
        client = TestClient(app)
        current_response = client.get('/api/risk/current?well_id=WELL-A')
        self.assertEqual(current_response.status_code, 200)
        fingerprint_response = client.get('/api/risk/fingerprint?well_id=WELL-A&event_type=Mud%20Loss')
        self.assertEqual(fingerprint_response.status_code, 200)


if __name__ == '__main__':
    unittest.main()
