with open('backend/app/services/copilot_engine.py', 'r') as f:
    content = f.read()

content = content.replace('reply = f"### ALERT EXPLANATION', 'reply = f\"\"\"### ALERT EXPLANATION')
content = content.replace('**Evidence:** {latest_alert.evidence}"', '**Evidence:** {latest_alert.evidence}\"\"\"')

content = content.replace('reply = f"### DISTANCE TO HISTORICAL RISK ZONE', 'reply = f\"\"\"### DISTANCE TO HISTORICAL RISK ZONE')
content = content.replace('Risk Severity: **{latest_alert.severity}**"', 'Risk Severity: **{latest_alert.severity}**\"\"\"')

content = content.replace('reply = f"### OFFSET WELLS INVOLVED', 'reply = f\"\"\"### OFFSET WELLS INVOLVED')
content = content.replace('upcoming depth interval."', 'upcoming depth interval.\"\"\"')

content = content.replace('reply = f"### SUPPORTING EVIDENCE & REPORTS', 'reply = f\"\"\"### SUPPORTING EVIDENCE & REPORTS')
content = content.replace('Relevant Historical Reports:\\n{reps_str}"', 'Relevant Historical Reports:\\n{reps_str}\"\"\"')

with open('backend/app/services/copilot_engine.py', 'w') as f:
    f.write(content)
