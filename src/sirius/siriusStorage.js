import { SIRIUS_DEFAULT_PROJECT } from "./siriusDefaults";

const PROJECTS_KEY = "siriusHS_projects_v2";
const ACTIVE_PROJECT_KEY = "siriusHS_active_project_v2";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function createProjectId() {
  return `sirius-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createSiriusProject(overrides = {}) {
  const now = new Date().toISOString();

  return {
    ...SIRIUS_DEFAULT_PROJECT,
    ...overrides,
    id: overrides.id || createProjectId(),
    createdAt: overrides.createdAt || now,
    updatedAt: now,
    palette: {
      ...SIRIUS_DEFAULT_PROJECT.palette,
      ...(overrides.palette || {}),
    },
    music: {
      ...SIRIUS_DEFAULT_PROJECT.music,
      ...(overrides.music || {}),
    },
    scenes: Array.isArray(overrides.scenes)
      ? overrides.scenes
      : [],
    guests: Array.isArray(overrides.guests)
      ? overrides.guests
      : [],
  };
}

export function getSiriusProjects() {
  try {
    return safeParse(
      localStorage.getItem(PROJECTS_KEY),
      []
    );
  } catch {
    return [];
  }
}

export function saveSiriusProject(project) {
  try {
    const normalized = createSiriusProject(project);

    const projects = getSiriusProjects();

    const index = projects.findIndex(
      (item) => item.id === normalized.id
    );

    if (index >= 0) {
      projects[index] = normalized;
    } else {
      projects.push(normalized);
    }

    localStorage.setItem(
      PROJECTS_KEY,
      JSON.stringify(projects)
    );

    localStorage.setItem(
      ACTIVE_PROJECT_KEY,
      normalized.id
    );

    return normalized;
  } catch (error) {
    console.error(
      "No se pudo guardar el proyecto Sirius:",
      error
    );

    return null;
  }
}

export function loadSiriusProject(projectId) {
  const projects = getSiriusProjects();

  if (!projectId) {
    return null;
  }

  return (
    projects.find(
      (project) => project.id === projectId
    ) || null
  );
}

export function getActiveSiriusProject() {
  try {
    const activeId = localStorage.getItem(
      ACTIVE_PROJECT_KEY
    );

    return loadSiriusProject(activeId);
  } catch {
    return null;
  }
}

export function setActiveSiriusProject(projectId) {
  try {
    localStorage.setItem(
      ACTIVE_PROJECT_KEY,
      projectId
    );

    return true;
  } catch {
    return false;
  }
}

export function deleteSiriusProject(projectId) {
  try {
    const projects = getSiriusProjects().filter(
      (project) => project.id !== projectId
    );

    localStorage.setItem(
      PROJECTS_KEY,
      JSON.stringify(projects)
    );

    const activeId = localStorage.getItem(
      ACTIVE_PROJECT_KEY
    );

    if (activeId === projectId) {
      localStorage.removeItem(
        ACTIVE_PROJECT_KEY
      );
    }

    return true;
  } catch {
    return false;
  }
}

export function duplicateSiriusProject(projectId) {
  const original = loadSiriusProject(projectId);

  if (!original) {
    return null;
  }

  const copy = createSiriusProject({
    ...original,
    id: createProjectId(),
    name: original.name
      ? `${original.name} — copia`
      : "Mi experiencia Sirius — copia",
  });

  return saveSiriusProject(copy);
}
