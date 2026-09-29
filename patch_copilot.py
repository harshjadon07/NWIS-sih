import re

with open("backend/app/services/copilot_engine.py", "r") as f:
    content = f.read()

target_str = """        structured_data = None"""
insert_str = """
        # --- ALERT EXPLANATION BRANCHES ---
        if "triggered" in text or "what triggered" in text or "caused this warning" in text or "show me the evidence" in text or "why is the risk increasing" in text or "how far are we from the historical risk zone" in text:
            # Let's see if we have active alerts
            from app.models import Alert
            latest_alert = self.db.query(Alert).order_by(Alert.timestamp.desc()).first()
            if latest_alert and latest_alert.status == "ACTIVE":
                if "triggered" in text or "why is the risk increasing" in text:
                    tools_called.append({"tool": "check_active_alerts", "args": {}, "summary": "Found active critical alert"})
                    reply = f"### ALERT EXPLANATION\\n\\nThe alert was triggered because the current drilling depth (**{latest_alert.depth:.0f}m**) is approaching a known historical risk zone. The model-estimated risk score is currently **{latest_alert.risk_score:.0f}%**.\\n\\n**Main Reason:** {latest_alert.reason}\\n\\n**Evidence:** {latest_alert.evidence}"
                    return {"reply": reply, "tools_called": tools_called, "context": current_ctx, "sources": sources, "structured_data": structured_data}
                
                elif "how far" in text:
                    tools_called.append({"tool": "calculate_distance_to_risk", "args": {"current_depth": latest_alert.depth}, "summary": "Calculated distance to hazard"})
                    dist = latest_alert.distance_to_zone if latest_alert.distance_to_zone else 0.0
                    reply = f"### DISTANCE TO HISTORICAL RISK ZONE\\n\\nWe are currently **{dist:.1f} meters** away from the top of the historical risk zone.\\n\\nCurrent depth: **{latest_alert.depth:.0f}m**\\nRisk Severity: **{latest_alert.severity}**"
                    return {"reply": reply, "tools_called": tools_called, "context": current_ctx, "sources": sources, "structured_data": structured_data}
                
                elif "which wells" in text or "caused this warning" in text:
                    tools_called.append({"tool": "get_related_wells", "args": {"alert_id": latest_alert.id}, "summary": "Retrieved offset wells involved"})
                    import json
                    wells_list = json.loads(latest_alert.related_wells) if latest_alert.related_wells else []
                    wells_str = ", ".join(wells_list) if wells_list else "None found."
                    reply = f"### OFFSET WELLS INVOLVED\\n\\nThe warning is primarily based on historical incidents from the following offset wells:\\n\\n**{wells_str}**\\n\\nThese wells experienced severe mud loss and other complications in the upcoming depth interval."
                    return {"reply": reply, "tools_called": tools_called, "context": current_ctx, "sources": sources, "structured_data": structured_data}
                
                elif "evidence" in text or "reports" in text:
                    tools_called.append({"tool": "get_related_reports", "args": {"alert_id": latest_alert.id}, "summary": "Retrieved linked evidence reports"})
                    import json
                    reports_list = json.loads(latest_alert.related_reports) if latest_alert.related_reports else []
                    reps_str = "\\n".join([f"- **{r}**" for r in reports_list]) if reports_list else "No specific reports linked."
                    reply = f"### SUPPORTING EVIDENCE & REPORTS\\n\\nHere is the main evidence for the active alert:\\n\\n> {latest_alert.evidence}\\n\\nRelevant Historical Reports:\\n{reps_str}"
                    return {"reply": reply, "tools_called": tools_called, "context": current_ctx, "sources": sources, "structured_data": structured_data}
"""

new_content = content.replace(target_str, target_str + insert_str.replace("\\n", "\n"))
with open("backend/app/services/copilot_engine.py", "w") as f:
    f.write(new_content)
