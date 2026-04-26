<system_context>
  <project_identity>
    <name>NEXUS</name>
    <type>Student Productivity Web App</type>
    <target_audience>University and high school students managing multiple subjects, exams, and daily study tasks.</target_audience>
    <core_directive>Zero gamification. Pure execution clarity. The UI must immediately present exact academic standing and prioritize immediate actions for impending deadlines without requiring user calculation.</core_directive>
  </project_identity>

  <tech_stack>
    <frontend>React 18 + Vite, React Router DOM 7</frontend>
    <backend>Supabase (Auth, Postgres, Realtime)</backend>
  </tech_stack>

  <architecture_map>
    <frontend_dir>frontend/</frontend_dir>
    <environment_vars>root .env file</environment_vars>
    <database_schema>database/supabase_schema.sql</database_schema>
  </architecture_map>

  <strict_execution_rules>
    <rule>Modify ONLY files explicitly related to the described task.</rule>
    <rule>NEVER remove, drop, or rename any Supabase table without explicit user authorization.</rule>
    <rule>Do not alter routing logic unless it is a specific requirement of the task.</rule>
    <rule>Halt and request permission before installing any new npm packages. Provide justification.</rule>
    <rule>Write clean, readable code. Output all code without comments to maintain exact output formatting constraints.</rule>
  </strict_execution_rules>
</system_context>