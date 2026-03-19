/**
 * ABLE LEAK DETECTION — JOB TYPE TEMPLATE DEFINITIONS
 *
 * These are the seed templates for the 7 core job types.
 * Each template maps to a JobTypeTemplate entity record.
 *
 * Field types supported:
 *   text        — single line text input
 *   textarea    — multi-line notes
 *   number      — numeric input (decimals ok)
 *   yes_no      — Yes / No toggle buttons
 *   pass_fail   — Pass / Fail toggle buttons
 *   select      — dropdown with predefined options
 *   checkbox    — single boolean tick
 *   date        — date picker
 *   result      — prominent result summary (styled differently, usually end of section)
 *   photo       — inline photo upload prompt within a section
 *   materials   — special: renders the materials-used table (quantity + cost)
 *
 * Report visibility:
 *   visible_client: true  → shown in client-facing PDF report
 *   visible_client: false → internal only (default false)
 *
 * Section types:
 *   standard    — normal field list
 *   materials   — triggers the materials table renderer
 *   signature   — future: signature capture
 */

export const JOB_TEMPLATES = [

  // ─────────────────────────────────────────────
  // 1. INITIAL LEAK INSPECTION
  // ─────────────────────────────────────────────
  {
    name: "Initial Leak Inspection",
    job_type_key: "leak_inspection",
    description: "Standard pool and spa leak inspection using dye testing, visual inspection, and equipment checks.",
    estimated_duration_hours: 2,
    default_price: 350,
    is_active: true,
    sections: [
      {
        section_id: "s_site",
        title: "Site Conditions",
        order: 1,
        fields: [
          { field_id: "f_pool_type",     label: "Pool Type",             type: "select",   order: 1, required: true,  options: ["Concrete", "Fibreglass", "Vinyl Liner", "Above Ground", "Spa", "Pond"], visible_client: true },
          { field_id: "f_pool_age",      label: "Approximate Pool Age",  type: "select",   order: 2, required: false, options: ["0–5 years", "5–10 years", "10–20 years", "20+ years"], visible_client: true },
          { field_id: "f_water_level",   label: "Water Level on Arrival",type: "select",   order: 3, required: true,  options: ["Full", "25% low", "50% low", "75% low", "Empty"], visible_client: true },
          { field_id: "f_weather",       label: "Weather Conditions",    type: "select",   order: 4, required: false, options: ["Fine", "Overcast", "Light Rain", "Windy"], visible_client: false },
          { field_id: "f_site_notes",    label: "Site Condition Notes",  type: "textarea", order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_visual",
        title: "Visual Inspection",
        order: 2,
        fields: [
          { field_id: "f_shell_cracks",  label: "Visible Cracks in Shell",      type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_shell_notes",   label: "Crack / Shell Notes",          type: "textarea", order: 2, required: false, visible_client: true },
          { field_id: "f_bond_beam",     label: "Bond Beam Damage",             type: "yes_no",   order: 3, required: true,  visible_client: true },
          { field_id: "f_fittings",      label: "Fittings / Jets Checked",      type: "yes_no",   order: 4, required: true,  visible_client: true },
          { field_id: "f_fittings_notes",label: "Fittings Notes",               type: "textarea", order: 5, required: false, visible_client: false },
          { field_id: "f_visual_photo",  label: "Photo of Visual Finding",      type: "photo",    order: 6, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_dye",
        title: "Dye Testing",
        order: 3,
        fields: [
          { field_id: "f_dye_main_drain",label: "Main Drain",        type: "pass_fail", order: 1, required: false, visible_client: true },
          { field_id: "f_dye_skimmer",   label: "Skimmer Box(es)",   type: "pass_fail", order: 2, required: false, visible_client: true },
          { field_id: "f_dye_returns",   label: "Returns / Jets",    type: "pass_fail", order: 3, required: false, visible_client: true },
          { field_id: "f_dye_lights",    label: "Light Niches",      type: "pass_fail", order: 4, required: false, visible_client: true },
          { field_id: "f_dye_steps",     label: "Steps / Corners",   type: "pass_fail", order: 5, required: false, visible_client: true },
          { field_id: "f_dye_notes",     label: "Dye Test Notes",    type: "textarea",  order: 6, required: false, visible_client: false },
          { field_id: "f_dye_photo",     label: "Dye Test Photo",    type: "photo",     order: 7, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_equipment",
        title: "Equipment Check",
        order: 4,
        fields: [
          { field_id: "f_pump",          label: "Pump Checked",          type: "yes_no",   order: 1, required: false, visible_client: false },
          { field_id: "f_filter",        label: "Filter Checked",        type: "yes_no",   order: 2, required: false, visible_client: false },
          { field_id: "f_chlorinator",   label: "Chlorinator Checked",   type: "yes_no",   order: 3, required: false, visible_client: false },
          { field_id: "f_equip_leak",    label: "Equipment Leak Found",  type: "yes_no",   order: 4, required: true,  visible_client: true },
          { field_id: "f_equip_notes",   label: "Equipment Notes",       type: "textarea", order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_result",
        title: "Inspection Result",
        order: 5,
        fields: [
          { field_id: "f_leak_found",    label: "Leak Located",          type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_leak_location", label: "Leak Location Description", type: "textarea", order: 2, required: false, visible_client: true },
          { field_id: "f_leak_photo",    label: "Leak Location Photo",   type: "photo",    order: 3, required: false, visible_client: true },
          { field_id: "f_recommendation",label: "Recommendation",        type: "select",   order: 4, required: true,  options: ["Repair Required", "Monitor Water Loss", "Further Testing Required", "No Action – No Leak Found"], visible_client: true },
          { field_id: "f_result_notes",  label: "Technician Summary",    type: "textarea", order: 5, required: true,  visible_client: true },
        ],
      },
      {
        section_id: "s_materials",
        title: "Materials Used",
        order: 6,
        section_type: "materials",
        fields: [],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. STRUCTURAL INSPECTION
  // ─────────────────────────────────────────────
  {
    name: "Structural Inspection",
    job_type_key: "structural_inspection",
    description: "In-depth structural assessment of pool shell, bond beam, coping, and surrounds.",
    estimated_duration_hours: 2,
    default_price: 450,
    is_active: true,
    sections: [
      {
        section_id: "s_site",
        title: "Site & Pool Details",
        order: 1,
        fields: [
          { field_id: "f_pool_type",     label: "Pool Type",             type: "select",   order: 1, required: true,  options: ["Concrete", "Fibreglass", "Vinyl Liner"], visible_client: true },
          { field_id: "f_pool_age",      label: "Approximate Age",       type: "select",   order: 2, required: false, options: ["0–5 years", "5–10 years", "10–20 years", "20+ years"], visible_client: true },
          { field_id: "f_construction",  label: "Construction Method",   type: "select",   order: 3, required: false, options: ["Gunite", "Poured Concrete", "Block & Render", "Fibreglass Shell", "Unknown"], visible_client: true },
        ],
      },
      {
        section_id: "s_shell",
        title: "Shell Assessment",
        order: 2,
        fields: [
          { field_id: "f_cracks_present",label: "Cracks Present",             type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_crack_type",    label: "Crack Type",                 type: "select",   order: 2, required: false, options: ["Hairline", "Structural", "Delamination", "Surface Only"], visible_client: true },
          { field_id: "f_crack_location",label: "Crack Location Description", type: "textarea", order: 3, required: false, visible_client: true },
          { field_id: "f_spalling",      label: "Spalling / Surface Damage",  type: "yes_no",   order: 4, required: true,  visible_client: true },
          { field_id: "f_shell_photo",   label: "Shell Photo",                type: "photo",    order: 5, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_bond_beam",
        title: "Bond Beam & Coping",
        order: 3,
        fields: [
          { field_id: "f_bb_damage",     label: "Bond Beam Damage",     type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_coping_lift",   label: "Coping Lifting / Loose",type: "yes_no",  order: 2, required: true,  visible_client: true },
          { field_id: "f_coping_grout",  label: "Grout / Sealant Failed",type: "yes_no",  order: 3, required: true,  visible_client: true },
          { field_id: "f_bb_notes",      label: "Bond Beam Notes",      type: "textarea", order: 4, required: false, visible_client: true },
          { field_id: "f_bb_photo",      label: "Bond Beam Photo",      type: "photo",    order: 5, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_surrounds",
        title: "Surrounds & Drainage",
        order: 4,
        fields: [
          { field_id: "f_deck_movement", label: "Deck Movement / Cracking",  type: "yes_no",   order: 1, required: false, visible_client: true },
          { field_id: "f_drainage",      label: "Adequate Drainage",         type: "yes_no",   order: 2, required: false, visible_client: true },
          { field_id: "f_surround_notes",label: "Surrounds Notes",           type: "textarea", order: 3, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_result",
        title: "Structural Assessment Result",
        order: 5,
        fields: [
          { field_id: "f_severity",      label: "Overall Severity",       type: "select",   order: 1, required: true,  options: ["No Issues", "Minor – Monitor", "Moderate – Repair Recommended", "Severe – Urgent Repair Required"], visible_client: true },
          { field_id: "f_result_notes",  label: "Assessment Summary",     type: "textarea", order: 2, required: true,  visible_client: true },
          { field_id: "f_result_photo",  label: "Summary Photo",          type: "photo",    order: 3, required: false, visible_client: true },
        ],
      },
      { section_id: "s_materials", title: "Materials Used", order: 6, section_type: "materials", fields: [] },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. PRESSURE TEST
  // ─────────────────────────────────────────────
  {
    name: "Pressure Test",
    job_type_key: "pressure_test",
    description: "Hydraulic pressure testing of pool plumbing lines to locate leaks.",
    estimated_duration_hours: 2,
    default_price: 380,
    is_active: true,
    sections: [
      {
        section_id: "s_setup",
        title: "Test Setup",
        order: 1,
        fields: [
          { field_id: "f_lines_tested",  label: "Lines to Test",         type: "textarea", order: 1, required: true,  visible_client: false, placeholder: "e.g. Suction, Return, Solar, Cleaner" },
          { field_id: "f_test_pressure", label: "Test Pressure (PSI)",   type: "number",   order: 2, required: true,  visible_client: false },
          { field_id: "f_setup_notes",   label: "Setup Notes",           type: "textarea", order: 3, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_suction",
        title: "Suction Lines",
        order: 2,
        fields: [
          { field_id: "f_main_drain",    label: "Main Drain",            type: "pass_fail", order: 1, required: false, visible_client: true },
          { field_id: "f_skimmer_1",     label: "Skimmer 1",             type: "pass_fail", order: 2, required: false, visible_client: true },
          { field_id: "f_skimmer_2",     label: "Skimmer 2",             type: "pass_fail", order: 3, required: false, visible_client: true },
          { field_id: "f_cleaner_point", label: "Cleaner Point",         type: "pass_fail", order: 4, required: false, visible_client: true },
          { field_id: "f_suction_notes", label: "Suction Notes",         type: "textarea",  order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_return",
        title: "Return Lines",
        order: 3,
        fields: [
          { field_id: "f_return_1",      label: "Return 1",              type: "pass_fail", order: 1, required: false, visible_client: true },
          { field_id: "f_return_2",      label: "Return 2",              type: "pass_fail", order: 2, required: false, visible_client: true },
          { field_id: "f_return_3",      label: "Return 3",              type: "pass_fail", order: 3, required: false, visible_client: true },
          { field_id: "f_spa_return",    label: "Spa Return",            type: "pass_fail", order: 4, required: false, visible_client: true },
          { field_id: "f_return_notes",  label: "Return Notes",          type: "textarea",  order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_other_lines",
        title: "Other Lines",
        order: 4,
        fields: [
          { field_id: "f_solar",         label: "Solar Line",            type: "pass_fail", order: 1, required: false, visible_client: true },
          { field_id: "f_waterfeat",     label: "Water Feature Line",    type: "pass_fail", order: 2, required: false, visible_client: true },
          { field_id: "f_heating",       label: "Heating Line",          type: "pass_fail", order: 3, required: false, visible_client: true },
          { field_id: "f_other_notes",   label: "Other Lines Notes",     type: "textarea",  order: 4, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_result",
        title: "Pressure Test Result",
        order: 5,
        fields: [
          { field_id: "f_leak_found",    label: "Leak Found in Plumbing",    type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_leak_line",     label: "Leaking Line(s)",           type: "textarea", order: 2, required: false, visible_client: true },
          { field_id: "f_excavation",    label: "Excavation Required",       type: "yes_no",   order: 3, required: false, visible_client: true },
          { field_id: "f_result_notes",  label: "Test Summary",              type: "textarea", order: 4, required: true,  visible_client: true },
          { field_id: "f_result_photo",  label: "Result Photo",              type: "photo",    order: 5, required: false, visible_client: true },
        ],
      },
      { section_id: "s_materials", title: "Materials Used", order: 6, section_type: "materials", fields: [] },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. SCUBA DIVE TEST
  // ─────────────────────────────────────────────
  {
    name: "Scuba Dive Test",
    job_type_key: "scuba_dive_test",
    description: "Underwater dye testing and inspection by certified diver while pool remains in use.",
    estimated_duration_hours: 3,
    default_price: 650,
    is_active: true,
    sections: [
      {
        section_id: "s_pre_dive",
        title: "Pre-Dive Check",
        order: 1,
        fields: [
          { field_id: "f_visibility",    label: "Water Visibility",      type: "select",   order: 1, required: true,  options: ["Excellent", "Good", "Fair", "Poor"], visible_client: false },
          { field_id: "f_water_temp",    label: "Water Temperature (°C)",type: "number",   order: 2, required: false, visible_client: false },
          { field_id: "f_chlorine_ok",   label: "Chlorine Levels Safe",  type: "yes_no",   order: 3, required: true,  visible_client: false },
          { field_id: "f_predive_notes", label: "Pre-Dive Notes",        type: "textarea", order: 4, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_underwater",
        title: "Underwater Inspection",
        order: 2,
        fields: [
          { field_id: "f_main_drain",    label: "Main Drain / Suction",      type: "pass_fail", order: 1, required: false, visible_client: true },
          { field_id: "f_returns",       label: "Return Fittings",           type: "pass_fail", order: 2, required: false, visible_client: true },
          { field_id: "f_lights",        label: "Light Niches",              type: "pass_fail", order: 3, required: false, visible_client: true },
          { field_id: "f_steps_ledges",  label: "Steps / Ledges",           type: "pass_fail", order: 4, required: false, visible_client: true },
          { field_id: "f_shell_floor",   label: "Shell Floor / Walls",       type: "pass_fail", order: 5, required: false, visible_client: true },
          { field_id: "f_spa_bond",      label: "Spa Bond / Spillway",       type: "pass_fail", order: 6, required: false, visible_client: true },
          { field_id: "f_underwater_notes",label: "Underwater Notes",        type: "textarea",  order: 7, required: false, visible_client: false },
          { field_id: "f_underwater_photo",label: "Underwater Photo/Video",  type: "photo",     order: 8, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_result",
        title: "Dive Test Result",
        order: 3,
        fields: [
          { field_id: "f_leak_found",    label: "Leak Located Underwater",   type: "yes_no",   order: 1, required: true,  visible_client: true },
          { field_id: "f_leak_location", label: "Leak Location Description", type: "textarea", order: 2, required: false, visible_client: true },
          { field_id: "f_recommendation",label: "Recommendation",            type: "select",   order: 3, required: true,  options: ["Repair – Underwater Possible", "Repair – Drain Required", "Further Testing", "No Leak Found"], visible_client: true },
          { field_id: "f_result_notes",  label: "Dive Summary",              type: "textarea", order: 4, required: true,  visible_client: true },
          { field_id: "f_result_photo",  label: "Finding Photo",             type: "photo",    order: 5, required: false, visible_client: true },
        ],
      },
      { section_id: "s_materials", title: "Materials Used", order: 4, section_type: "materials", fields: [] },
    ],
  },

  // ─────────────────────────────────────────────
  // 5. REPAIR QUOTE
  // ─────────────────────────────────────────────
  {
    name: "Repair Quote",
    job_type_key: "repair",
    description: "On-site assessment to produce a repair scope and cost estimate.",
    estimated_duration_hours: 1,
    default_price: 0,
    is_active: true,
    sections: [
      {
        section_id: "s_assessment",
        title: "Repair Assessment",
        order: 1,
        fields: [
          { field_id: "f_repair_type",   label: "Type of Repair Required", type: "select",   order: 1, required: true,  options: ["Shell Crack Repair", "Fitting Replacement", "Pipe Repair / Splice", "Light Niche Repair", "Skimmer Repair", "Bond Beam Repair", "Surface Patch", "Multiple / Other"], visible_client: true },
          { field_id: "f_location",      label: "Repair Location",          type: "textarea", order: 2, required: true,  visible_client: true },
          { field_id: "f_access_req",    label: "Access / Excavation Required", type: "yes_no", order: 3, required: false, visible_client: true },
          { field_id: "f_drain_req",     label: "Pool Drain Required",      type: "yes_no",   order: 4, required: false, visible_client: true },
          { field_id: "f_scope_notes",   label: "Scope of Works",           type: "textarea", order: 5, required: true,  visible_client: true },
          { field_id: "f_scope_photo",   label: "Scope Photo",              type: "photo",    order: 6, required: false, visible_client: true },
        ],
      },
      {
        section_id: "s_estimate",
        title: "Cost Estimate",
        order: 2,
        fields: [
          { field_id: "f_labour_hrs",    label: "Estimated Labour Hours",   type: "number",   order: 1, required: false, visible_client: false },
          { field_id: "f_materials_est", label: "Estimated Materials Cost ($)", type: "number", order: 2, required: false, visible_client: false },
          { field_id: "f_total_est",     label: "Estimated Total ($)",      type: "number",   order: 3, required: false, visible_client: false },
          { field_id: "f_estimate_notes",label: "Quote Notes",              type: "textarea", order: 4, required: false, visible_client: false },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 6. REPAIR JOB
  // ─────────────────────────────────────────────
  {
    name: "Repair Job",
    job_type_key: "repair",
    description: "Execution of approved repair works including materials tracking and before/after documentation.",
    estimated_duration_hours: 3,
    default_price: 0,
    is_active: true,
    sections: [
      {
        section_id: "s_pre_repair",
        title: "Pre-Repair",
        order: 1,
        fields: [
          { field_id: "f_repair_type",   label: "Repair Type",              type: "select",   order: 1, required: true,  options: ["Shell Crack Repair", "Fitting Replacement", "Pipe Repair / Splice", "Light Niche Repair", "Skimmer Repair", "Bond Beam Repair", "Surface Patch", "Multiple / Other"], visible_client: true },
          { field_id: "f_before_photo",  label: "Before Photo",             type: "photo",    order: 2, required: true,  visible_client: true },
          { field_id: "f_water_level",   label: "Water Level",              type: "select",   order: 3, required: false, options: ["Full", "Partial Drain", "Empty"], visible_client: false },
          { field_id: "f_pre_notes",     label: "Pre-Repair Notes",         type: "textarea", order: 4, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_works",
        title: "Works Performed",
        order: 2,
        fields: [
          { field_id: "f_works_desc",    label: "Description of Works",     type: "textarea", order: 1, required: true,  visible_client: true },
          { field_id: "f_product_used",  label: "Products / Methods Used",  type: "textarea", order: 2, required: false, visible_client: false },
          { field_id: "f_cure_time",     label: "Cure / Drying Time Advised",type: "text",    order: 3, required: false, visible_client: true },
          { field_id: "f_during_photo",  label: "During Repair Photo",      type: "photo",    order: 4, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_post_repair",
        title: "Post-Repair Check",
        order: 3,
        fields: [
          { field_id: "f_after_photo",   label: "After Photo",              type: "photo",    order: 1, required: true,  visible_client: true },
          { field_id: "f_pressure_retest",label: "Pressure Re-Test Passed", type: "pass_fail",order: 2, required: false, visible_client: true },
          { field_id: "f_refill_started",label: "Pool Refill Started",      type: "yes_no",   order: 3, required: false, visible_client: false },
          { field_id: "f_client_advised",label: "Client Advised of Care Instructions", type: "yes_no", order: 4, required: false, visible_client: false },
          { field_id: "f_post_notes",    label: "Post-Repair Notes",        type: "textarea", order: 5, required: true,  visible_client: true },
        ],
      },
      {
        section_id: "s_warranty",
        title: "Warranty & Sign-Off",
        order: 4,
        fields: [
          { field_id: "f_warranty",      label: "Warranty Period",          type: "select",   order: 1, required: false, options: ["No Warranty", "30 Days", "90 Days", "6 Months", "12 Months"], visible_client: true },
          { field_id: "f_followup_req",  label: "Follow-Up Required",       type: "yes_no",   order: 2, required: false, visible_client: false },
          { field_id: "f_followup_notes",label: "Follow-Up Notes",          type: "textarea", order: 3, required: false, visible_client: false },
        ],
      },
      { section_id: "s_materials", title: "Materials Used", order: 5, section_type: "materials", fields: [] },
    ],
  },

  // ─────────────────────────────────────────────
  // 7. SERVICE CALL
  // ─────────────────────────────────────────────
  {
    name: "Service Call",
    job_type_key: "service_call",
    description: "General pool service, equipment check, and maintenance visit.",
    estimated_duration_hours: 1.5,
    default_price: 180,
    is_active: true,
    sections: [
      {
        section_id: "s_equipment",
        title: "Equipment Check",
        order: 1,
        fields: [
          { field_id: "f_pump",          label: "Pump Operating",           type: "pass_fail", order: 1, required: true,  visible_client: true },
          { field_id: "f_filter",        label: "Filter Pressure OK",       type: "pass_fail", order: 2, required: true,  visible_client: true },
          { field_id: "f_filter_psi",    label: "Filter Pressure (PSI)",    type: "number",    order: 3, required: false, visible_client: false },
          { field_id: "f_chlorinator",   label: "Chlorinator / Salt Cell",  type: "pass_fail", order: 4, required: false, visible_client: true },
          { field_id: "f_timeclock",     label: "Timeclock / Controller",   type: "pass_fail", order: 5, required: false, visible_client: true },
          { field_id: "f_equip_notes",   label: "Equipment Notes",          type: "textarea",  order: 6, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_water",
        title: "Water Quality",
        order: 2,
        fields: [
          { field_id: "f_chlorine",      label: "Free Chlorine (ppm)",      type: "number",    order: 1, required: false, visible_client: true },
          { field_id: "f_ph",            label: "pH",                       type: "number",    order: 2, required: false, visible_client: true },
          { field_id: "f_alk",           label: "Total Alkalinity (ppm)",   type: "number",    order: 3, required: false, visible_client: true },
          { field_id: "f_salt",          label: "Salt Level (ppm)",         type: "number",    order: 4, required: false, visible_client: false },
          { field_id: "f_water_notes",   label: "Water Quality Notes",      type: "textarea",  order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_service",
        title: "Service Performed",
        order: 3,
        fields: [
          { field_id: "f_backwash",      label: "Filter Backwashed",        type: "yes_no",   order: 1, required: false, visible_client: true },
          { field_id: "f_basket_clear",  label: "Baskets Cleared",          type: "yes_no",   order: 2, required: false, visible_client: true },
          { field_id: "f_dose",          label: "Chemical Dose Added",      type: "yes_no",   order: 3, required: false, visible_client: true },
          { field_id: "f_service_notes", label: "Service Notes",            type: "textarea", order: 4, required: false, visible_client: true },
          { field_id: "f_service_photo", label: "Service Photo",            type: "photo",    order: 5, required: false, visible_client: false },
        ],
      },
      {
        section_id: "s_result",
        title: "Service Result",
        order: 4,
        fields: [
          { field_id: "f_issues_found",  label: "Issues Found",             type: "yes_no",   order: 1, required: false, visible_client: true },
          { field_id: "f_issues_notes",  label: "Issues Description",       type: "textarea", order: 2, required: false, visible_client: true },
          { field_id: "f_followup",      label: "Follow-Up Required",       type: "yes_no",   order: 3, required: false, visible_client: false },
          { field_id: "f_result_notes",  label: "Summary",                  type: "textarea", order: 4, required: true,  visible_client: true },
        ],
      },
      { section_id: "s_materials", title: "Materials Used", order: 5, section_type: "materials", fields: [] },
    ],
  },
];