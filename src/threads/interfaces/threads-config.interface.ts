export interface ThreadsConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface ThreadsAuthToken {
  accessToken: string;
  userId: string;
  expiresIn: number;
}

export interface ThreadsPost {
  text: string;
  mediaUrls?: string[];
  altTexts?: string[];
  linkAttachment?: string;
} 