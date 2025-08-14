export interface MiniApp {
  _id?: string;
  appId: string;
  name: string;
  description: string;
  iconUrl: string;
  splashUrl: string;
  homeUrl: string;
  miniappUrl: string;
  metadata: any;
  ownerFid: number;
  createdAt: Date;
  updatedAt: Date;
  totalRatings: number;
  averageRating: number;
  totalFeedback: number;
}

export interface Feedback {
  _id?: string;
  appId: string;
  rating: number;
  comment: string;
  userFid?: number;
  userName?: string;
  userDisplayName?: string;
  userPfpUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AppRegistrationData {
  name: string;
  description: string;
  iconUrl: string;
  splashUrl: string;
  homeUrl: string;
  miniappUrl: string;
  metadata: any;
}

export interface FeedbackData {
  rating: number;
  comment: string;
}
