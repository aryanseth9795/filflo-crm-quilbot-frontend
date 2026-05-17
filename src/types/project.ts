export interface Project {
  _id: string;
  name: string;
  description?: string;
  githubRepoUrl?: string;
  isActive: boolean;
  createdBy: { _id: string; name: string; email: string } | string;
  mainDeveloper?: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

export interface ProjectWithWebhook extends Project {
  webhookUrl: string;
  webhookSecret: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  githubRepoUrl?: string;
  mainDeveloper?: string;
}
