/**
 * GitHub MCP Connector
 * Allows JARVIS to interact with GitHub repositories
 * All destructive actions require human approval via the orchestrator
 *
 * @module github-mcp
 * @requires governance/auditor for security logging
 */

import { logSecurityEvent } from "../governance/auditor";

// ─── Configuration ───────────────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = "https://api.github.com";

if (!GITHUB_TOKEN) {
  console.warn(
    "[GitHub MCP] GITHUB_TOKEN environment variable is not set. " +
      "GitHub operations will fail."
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Classification of GitHub action types */
export interface GitHubAction {
  type: "read" | "write" | "admin";
  action: string;
  params: Record<string, unknown>;
}

/** GitHub repository reference */
export interface RepoRef {
  owner: string;
  name: string;
}

/** Minimal commit metadata */
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

/** Minimal issue metadata */
export interface IssueInfo {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: string[];
  author: string;
  createdAt: string;
  url: string;
}

/** Minimal pull request metadata */
export interface PullRequestInfo {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  head: string;
  base: string;
  createdAt: string;
  url: string;
}

/** Workflow run metadata */
export interface WorkflowRunInfo {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  createdAt: string;
  url: string;
}

/** File content response */
export interface FileContent {
  content: string;
  sha: string;
  size: number;
  encoding: "utf-8" | "base64";
}

/** Directory entry */
export interface DirectoryEntry {
  name: string;
  type: "file" | "dir" | "symlink" | "submodule";
  path: string;
  sha: string;
  size?: number;
  url: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a repo string in "owner/name" format into structured parts.
 */
function parseRepo(repo: string): RepoRef {
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid repository format: "${repo}". Expected "owner/name".`
    );
  }
  return { owner: parts[0], name: parts[1] };
}

/**
 * Build the request headers for GitHub API calls.
 */
function buildHeaders(): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "JARVIS-MCP/1.0",
  };
}

/**
 * Execute a fetch request against the GitHub API with error handling.
 */
async function githubFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${GITHUB_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { ...buildHeaders(), ...(options?.headers || {}) },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error (${response.status}): ${response.statusText} - ${errorBody}`
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

/**
 * Log an operation event to the security audit system.
 */
function logOperation(
  operation: string,
  repo: string,
  status: "success" | "failure",
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    service: "github",
    operation,
    target: repo,
    status,
    timestamp: new Date().toISOString(),
    details,
  }).catch((err) => {
    console.error(`[GitHub MCP] Audit logging failed: ${err.message}`);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ-ONLY OPERATIONS — No approval required
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get general information about a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @returns Repository metadata
 */
export async function getRepositoryInfo(repo: string): Promise<unknown> {
  const { owner, name } = parseRepo(repo);
  try {
    const result = await githubFetch<unknown>(`/repos/${owner}/${name}`);
    logOperation("getRepositoryInfo", repo, "success");
    return result;
  } catch (error) {
    logOperation("getRepositoryInfo", repo, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List commits on a branch.
 *
 * @param repo - Repository in "owner/name" format
 * @param branch - Branch name (defaults to default branch)
 * @param limit - Maximum commits to return (max 100)
 * @returns Array of commit info objects
 */
export async function listCommits(
  repo: string,
  branch?: string,
  limit: number = 30
): Promise<CommitInfo[]> {
  const { owner, name } = parseRepo(repo);
  const sha = branch ? `?sha=${encodeURIComponent(branch)}` : "";
  const perPage = `&per_page=${Math.min(limit, 100)}`;

  try {
    const commits = (await githubFetch<
      Array<{
        sha: string;
        commit: { message: string; author: { name: string; date: string } };
        html_url: string;
      }>
    >(`/repos/${owner}/${name}/commits${sha}${perPage}`)) as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      html_url: string;
    }>;

    const result: CommitInfo[] = commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    logOperation("listCommits", repo, "success", { branch, count: result.length });
    return result;
  } catch (error) {
    logOperation("listCommits", repo, "failure", {
      branch,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the content of a file from a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @param path - File path within the repository
 * @param branch - Branch name (defaults to default branch)
 * @returns File content as a string
 */
export async function getFileContent(
  repo: string,
  path: string,
  branch?: string
): Promise<string> {
  const { owner, name } = parseRepo(repo);
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";

  try {
    const data = await githubFetch<{
      content: string;
      encoding: "base64" | "utf-8";
      sha: string;
    }>(`/repos/${owner}/${name}/contents/${encodeURIComponent(path)}${ref}`);

    let content: string;
    if (data.encoding === "base64") {
      content = Buffer.from(data.content, "base64").toString("utf-8");
    } else {
      content = data.content;
    }

    logOperation("getFileContent", repo, "success", { path, branch });
    return content;
  } catch (error) {
    logOperation("getFileContent", repo, "failure", {
      path,
      branch,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List contents of a directory in a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @param path - Directory path within the repository
 * @param branch - Branch name (defaults to default branch)
 * @returns Array of directory entries
 */
export async function listDirectory(
  repo: string,
  path: string = "/",
  branch?: string
): Promise<DirectoryEntry[]> {
  const { owner, name } = parseRepo(repo);
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const apiPath = path === "/" ? "" : encodeURIComponent(path);

  try {
    const items = await githubFetch<
      Array<{
        name: string;
        type: "file" | "dir" | "symlink" | "submodule";
        path: string;
        sha: string;
        size?: number;
        html_url: string;
      }>
    >(`/repos/${owner}/${name}/contents/${apiPath}${ref}`);

    const result: DirectoryEntry[] = (Array.isArray(items) ? items : [items]).map(
      (item) => ({
        name: item.name,
        type: item.type,
        path: item.path,
        sha: item.sha,
        size: item.size,
        url: item.html_url,
      })
    );

    logOperation("listDirectory", repo, "success", { path, branch, count: result.length });
    return result;
  } catch (error) {
    logOperation("listDirectory", repo, "failure", {
      path,
      branch,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get issues from a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @param state - Filter by issue state
 * @param labels - Filter by label names
 * @returns Array of issue info objects
 */
export async function getIssues(
  repo: string,
  state: "open" | "closed" | "all" = "open",
  labels?: string[]
): Promise<IssueInfo[]> {
  const { owner, name } = parseRepo(repo);
  const query = new URLSearchParams();
  query.set("state", state);
  if (labels && labels.length > 0) {
    query.set("labels", labels.join(","));
  }

  try {
    const issues = await githubFetch<
      Array<{
        number: number;
        title: string;
        state: string;
        labels: Array<{ name: string }>;
        user: { login: string };
        created_at: string;
        html_url: string;
      }>
    >(`/repos/${owner}/${name}/issues?${query.toString()}`);

    const result: IssueInfo[] = issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state as "open" | "closed",
      labels: issue.labels.map((l) => l.name),
      author: issue.user.login,
      createdAt: issue.created_at,
      url: issue.html_url,
    }));

    logOperation("getIssues", repo, "success", { state, count: result.length });
    return result;
  } catch (error) {
    logOperation("getIssues", repo, "failure", {
      state,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get pull requests from a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @param state - Filter by PR state
 * @returns Array of pull request info objects
 */
export async function getPullRequests(
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<PullRequestInfo[]> {
  const { owner, name } = parseRepo(repo);

  try {
    const prs = await githubFetch<
      Array<{
        number: number;
        title: string;
        state: string;
        user: { login: string };
        head: { ref: string };
        base: { ref: string };
        created_at: string;
        html_url: string;
      }>
    >(`/repos/${owner}/${name}/pulls?state=${state}`);

    const result: PullRequestInfo[] = prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state as "open" | "closed",
      author: pr.user.login,
      head: pr.head.ref,
      base: pr.base.ref,
      createdAt: pr.created_at,
      url: pr.html_url,
    }));

    logOperation("getPullRequests", repo, "success", { state, count: result.length });
    return result;
  } catch (error) {
    logOperation("getPullRequests", repo, "failure", {
      state,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get workflow runs for a repository or specific workflow.
 *
 * @param repo - Repository in "owner/name" format
 * @param workflowId - Optional workflow ID or filename to filter by
 * @returns Array of workflow run info objects
 */
export async function getWorkflowRuns(
  repo: string,
  workflowId?: string
): Promise<WorkflowRunInfo[]> {
  const { owner, name } = parseRepo(repo);
  const endpoint = workflowId
    ? `/repos/${owner}/${name}/actions/workflows/${encodeURIComponent(workflowId)}/runs`
    : `/repos/${owner}/${name}/actions/runs`;

  try {
    interface WorkflowRunsResponse {
      workflow_runs: Array<{
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        head_branch: string;
        created_at: string;
        html_url: string;
      }>;
    }
    const data = await githubFetch<WorkflowRunsResponse>(`${endpoint}?per_page=30`);

    const result: WorkflowRunInfo[] = data.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      createdAt: run.created_at,
      url: run.html_url,
    }));

    logOperation("getWorkflowRuns", repo, "success", {
      workflowId,
      count: result.length,
    });
    return result;
  } catch (error) {
    logOperation("getWorkflowRuns", repo, "failure", {
      workflowId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get all branches for a repository.
 *
 * @param repo - Repository in "owner/name" format
 * @returns Array of branch names
 */
export async function getRepositoryBranches(repo: string): Promise<string[]> {
  const { owner, name } = parseRepo(repo);

  try {
    const branches = await githubFetch<
      Array<{ name: string }>
    >(`/repos/${owner}/${name}/branches?per_page=100`);

    const result = branches.map((b) => b.name);
    logOperation("getRepositoryBranches", repo, "success", { count: result.length });
    return result;
  } catch (error) {
    logOperation("getRepositoryBranches", repo, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE OPERATIONS — Require governance approval
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create or update a file in a repository by committing it.
 *
 * @param repo - Repository in "owner/name" format
 * @param path - File path within the repository
 * @param content - File content as string
 * @param message - Commit message
 * @param branch - Target branch
 * @returns Commit result
 */
export async function createCommit(
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    // 1. Get the current file SHA if it exists (for updates)
    let currentSha: string | undefined;
    try {
      const fileData = await githubFetch<{ sha: string }>(
        `/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`
      );
      currentSha = fileData.sha;
    } catch {
      // File doesn't exist yet, which is fine for new files
      currentSha = undefined;
    }

    // 2. Create or update the file
    const body: Record<string, string> = {
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
    };
    if (currentSha) {
      body.sha = currentSha;
    }

    const result = await githubFetch<unknown>(
      `/repos/${owner}/${name}/contents/${encodeURIComponent(path)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    logOperation("createCommit", repo, "success", { path, branch, message });
    return result;
  } catch (error) {
    logOperation("createCommit", repo, "failure", {
      path,
      branch,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Create a new pull request.
 *
 * @param repo - Repository in "owner/name" format
 * @param title - PR title
 * @param body - PR description
 * @param head - Head branch (source)
 * @param base - Base branch (target)
 * @returns Created pull request data
 */
export async function createPullRequest(
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    const result = await githubFetch<unknown>(`/repos/${owner}/${name}/pulls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, head, base }),
    });

    logOperation("createPullRequest", repo, "success", { title, head, base });
    return result;
  } catch (error) {
    logOperation("createPullRequest", repo, "failure", {
      title,
      head,
      base,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Merge a pull request.
 *
 * @param repo - Repository in "owner/name" format
 * @param prNumber - Pull request number
 * @returns Merge result
 */
export async function mergePullRequest(
  repo: string,
  prNumber: number
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    const result = await githubFetch<unknown>(
      `/repos/${owner}/${name}/pulls/${prNumber}/merge`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merge_method: "squash" }),
      }
    );

    logOperation("mergePullRequest", repo, "success", { prNumber });
    return result;
  } catch (error) {
    logOperation("mergePullRequest", repo, "failure", {
      prNumber,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Create a new issue.
 *
 * @param repo - Repository in "owner/name" format
 * @param title - Issue title
 * @param body - Issue body
 * @param labels - Label names to apply
 * @returns Created issue data
 */
export async function createIssue(
  repo: string,
  title: string,
  body: string,
  labels?: string[]
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    const payload: Record<string, unknown> = { title, body };
    if (labels && labels.length > 0) {
      payload.labels = labels;
    }

    const result = await githubFetch<unknown>(`/repos/${owner}/${name}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    logOperation("createIssue", repo, "success", { title, labels });
    return result;
  } catch (error) {
    logOperation("createIssue", repo, "failure", {
      title,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Close an existing issue.
 *
 * @param repo - Repository in "owner/name" format
 * @param issueNumber - Issue number to close
 * @returns Updated issue data
 */
export async function closeIssue(
  repo: string,
  issueNumber: number
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    const result = await githubFetch<unknown>(
      `/repos/${owner}/${name}/issues/${issueNumber}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "closed" }),
      }
    );

    logOperation("closeIssue", repo, "success", { issueNumber });
    return result;
  } catch (error) {
    logOperation("closeIssue", repo, "failure", {
      issueNumber,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Trigger a workflow run.
 *
 * @param repo - Repository in "owner/name" format
 * @param workflowId - Workflow ID or filename (e.g., "ci.yml")
 * @param branch - Branch to run on
 * @returns Trigger result
 */
export async function triggerWorkflow(
  repo: string,
  workflowId: string,
  branch?: string
): Promise<unknown> {
  const { owner, name } = parseRepo(repo);

  try {
    const result = await githubFetch<unknown>(
      `/repos/${owner}/${name}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: branch || "main",
        }),
      }
    );

    logOperation("triggerWorkflow", repo, "success", { workflowId, branch });
    return result;
  } catch (error) {
    logOperation("triggerWorkflow", repo, "failure", {
      workflowId,
      branch,
      error: (error as Error).message,
    });
    throw error;
  }
}
