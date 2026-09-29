import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_rich_synthetic_pdf(filepath: str, title: str, doc_type: str, well: str, content_lines: list):
    c = canvas.Canvas(filepath, pagesize=letter)
    
    # Header banner
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 750, f"OIL INDIA LIMITED - {doc_type.upper()}")
    
    c.setFont("Helvetica-Bold", 11)
    c.setFillColorRGB(0.8, 0.1, 0.1)
    c.drawString(50, 732, "CONFIDENTIAL / SYNTHETIC DEMONSTRATION REPORT — NOT ACTUAL OIL DATA")
    c.setFillColorRGB(0, 0, 0)
    
    c.setLineWidth(1)
    c.line(50, 722, 560, 722)
    
    # Metadata Block
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 705, f"Report Title: {title}")
    c.drawString(50, 690, f"Target Well: {well} | Document Type: {doc_type}")
    c.drawString(380, 690, "System: NWIS RAG Archive")
    
    c.line(50, 680, 560, 680)
    
    # Body Content
    c.setFont("Helvetica", 10)
    y = 660
    for line in content_lines:
        if line.startswith("##"):
            y -= 10
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, line.replace("##", "").strip())
            c.setFont("Helvetica", 10)
            y -= 18
        else:
            c.drawString(50, y, line)
            y -= 15
        if y < 60:
            c.showPage()
            y = 750
            c.setFont("Helvetica", 10)
            
    c.save()

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "..", "sample_reports")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Well Completion Report - WELL-B
    create_rich_synthetic_pdf(
        os.path.join(output_dir, "WCR_WELL_B.pdf"),
        "End of Well Report & Completion Summary",
        "Well Completion Report",
        "WELL-B",
        [
            "## 1. Operational Overview",
            "Well: WELL-B was spudded on 2021-03-10 and drilled to final target depth of 3,100 m.",
            "Synthetic demonstration report — not actual OIL data.",
            "Primary target formations encountered include Tipam Sandstone, Barail Series, and Formation-X.",
            "",
            "## 2. Critical Geological & Drilling Incident",
            "Date: 2021-05-14",
            "Severe mud losses occurred at 2475 m while penetrating the upper section of Formation-X (Naga Thrust Zone).",
            "Loss Rate: Initial total loss rate estimated at 45 bbl/hr with standpipe pressure dropping by 350 psi.",
            "Event: Mud Loss. Severity: Severe.",
            "Cause: Intersected natural micro-fracture network within high-permeability zone of Formation-X.",
            "Mitigation: Applied high-viscosity LCM treatment pill containing 40 ppb coarse fibrous material and mica.",
            "Outcome: Losses reduced to 2 bbl/hr seepage; LCM treatment was applied and drilling resumed.",
            "",
            "## 3. Post-Drilling Parameters",
            "Mud Weight: 1.18 SG, ROP: 14 m/hr, WOB: 18 klbf, Flow Rate: 420 gpm.",
            "Casing 9-5/8 inch set successfully at 2650 m."
        ]
    )
    
    # 2. Daily Drilling Report - WELL-C
    create_rich_synthetic_pdf(
        os.path.join(output_dir, "DDR_WELL_C_Day42.pdf"),
        "Daily Operations Log - Shift 24hr",
        "Daily Drilling Report",
        "WELL-C",
        [
            "## 1. Daily Summary",
            "Well: WELL-C. Date: 2022-08-19. Shift Supervisor: Operations Team.",
            "Synthetic demonstration report — not actual OIL data.",
            "Current Depth: 2150 m in Barail Series formation.",
            "",
            "## 2. Incident Log - Mechanical Stuck Pipe",
            "Depth: 2150 m. Event: Stuck Pipe. Severity: High.",
            "Cause: Differential sticking due to excessive mud cake buildup against Barail Series sandstone bench.",
            "Drilling Parameter: Torque spiked to 34 kNm, RPM dropped to 0 unexpectedly while reaming.",
            "Mitigation: Spotted 50 bbl low-toxicity oil-based pipe-freeing pill across stuck interval. Jarred upward at 110 klbf.",
            "Outcome: Pipe freed after 6.5 hours of jarring; circulated bottoms up and conditioned mud.",
            "NPT recorded: 8.5 hours."
        ]
    )

    # 3. Mud Report - WELL-D
    create_rich_synthetic_pdf(
        os.path.join(output_dir, "MUD_REPORT_WELL_D.pdf"),
        "Rheology and Fluid Integrity Report",
        "Mud Report",
        "WELL-D",
        [
            "## 1. Fluid System Specifications",
            "Well: WELL-D. Date: 2023-01-22.",
            "Synthetic demonstration report — not actual OIL data.",
            "Current Depth: 2890 m in Disang Shale formation.",
            "",
            "## 2. Overpressure & Gas Influx Event",
            "Depth: 2890 m. Event: Kick. Severity: Critical.",
            "Cause: Abrupt pore pressure transition zone encountered in lower Disang Shale.",
            "Observations: Pit volume increase of 14 bbl in 4 minutes with pump pressure fluctuation.",
            "Mitigation: Shut in well immediately using annular blowout preventer. Applied Wait and Weight well kill method.",
            "Outcome: Influx circulated out safely; well killed successfully and mud weight raised from 1.15 to 1.28 SG.",
            "Operations resumed after 16 hours of pressure verification."
        ]
    )

    # 4. Cementing Report - WELL-E
    create_rich_synthetic_pdf(
        os.path.join(output_dir, "CEMENTING_REPORT_WELL_E.pdf"),
        "Production Casing Cement Evaluation",
        "Cementing Report",
        "WELL-E",
        [
            "## 1. Job Description",
            "Well: WELL-E. Date: 2023-11-04.",
            "Synthetic demonstration report — not actual OIL data.",
            "Depth: 3200 m across Naga Thrust Zone.",
            "",
            "## 2. Cement Channeling & Remedial Action",
            "Event: Cementing Issue. Severity: Medium.",
            "Cause: Channeling occurred behind 7-inch production liner due to incomplete mud displacement.",
            "Mitigation: Performed acoustic CBL/VDL log, followed by squeeze cementing with 80 sacks microfine cement.",
            "Outcome: Isolation verified by negative pressure test; casing integrity confirmed.",
            "Drilling parameter: Standpipe pressure during squeeze reached 2400 psi."
        ]
    )

    print("Generated 4 comprehensive synthetic reports in sample_reports directory.")
