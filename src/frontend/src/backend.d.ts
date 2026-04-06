import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Ad {
    id: bigint;
    title: string;
    active: boolean;
    views: bigint;
    targetUrl: string;
    imageUrl: string;
}
export type WithdrawalMethod = {
    __kind__: "upi";
    upi: string;
} | {
    __kind__: "bank";
    bank: {
        ifsc: string;
        accountNumber: string;
    };
};
export interface Comment {
    id: bigint;
    content: string;
    author: Principal;
    timestamp: bigint;
    replies: Array<Comment>;
}
export interface FriendRequest {
    id: bigint;
    to: Principal;
    status: FriendRequestStatus;
    from: Principal;
    timestamp: bigint;
}
export interface Withdrawal {
    id: bigint;
    status: WithdrawalStatus;
    method: WithdrawalMethod;
    user: Principal;
    timestamp: bigint;
    amount: bigint;
}
export interface Post {
    id: bigint;
    postType: PostType;
    shares: bigint;
    views: Array<Principal>;
    author: Principal;
    mediaUrl: string;
    likes: Array<Principal>;
    saves: Array<Principal>;
    timestamp: bigint;
    caption: string;
    comments: Array<Comment>;
}
export interface Notification {
    id: bigint;
    notifType: NotificationType;
    read: boolean;
    recipient: Principal;
    sender: Principal;
    message: string;
    timestamp: bigint;
    postId?: bigint;
}
export interface UserProfile {
    bio: string;
    username: string;
    name: string;
    role: UserRole;
    totalEarnings: bigint;
    followers: Array<Principal>;
    following: Array<Principal>;
    profilePicture?: string;
    walletBalance: bigint;
}
export enum FriendRequestStatus {
    pending = "pending",
    rejected = "rejected",
    accepted = "accepted"
}
export enum NotificationType {
    like = "like",
    comment = "comment",
    friendRequest = "friendRequest",
    follow = "follow"
}
export enum PostType {
    video = "video",
    reel = "reel",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    acceptFriendRequest(requestId: bigint): Promise<void>;
    addComment(postId: bigint, content: string): Promise<bigint>;
    approveWithdrawal(withdrawalId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    banUser(user: Principal): Promise<void>;
    createAd(title: string, imageUrl: string, targetUrl: string): Promise<bigint>;
    createPost(caption: string, mediaUrl: string, postType: PostType): Promise<bigint>;
    createUserProfile(name: string, username: string, bio: string): Promise<void>;
    deletePost(postId: bigint): Promise<void>;
    followUser(userToFollow: Principal): Promise<void>;
    getAdminStats(): Promise<{
        totalEarningsPaid: bigint;
        totalUsers: bigint;
        totalPosts: bigint;
    }>;
    getAds(): Promise<Array<Ad>>;
    getAllWithdrawals(): Promise<Array<Withdrawal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getFeedPosts(): Promise<Array<Post>>;
    getFriendRequests(): Promise<Array<FriendRequest>>;
    getNotifications(): Promise<Array<Notification>>;
    getPendingWithdrawals(): Promise<Array<Withdrawal>>;
    getPost(postId: bigint): Promise<Post | null>;
    getUserPosts(user: Principal): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSuggestions(): Promise<Array<Principal>>;
    getWalletBalance(): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    markNotificationAsRead(notificationId: bigint): Promise<void>;
    rejectFriendRequest(requestId: bigint): Promise<void>;
    rejectWithdrawal(withdrawalId: bigint): Promise<void>;
    requestWithdrawal(amount: bigint, method: WithdrawalMethod): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePost(postId: bigint): Promise<void>;
    sendFriendRequest(to: Principal): Promise<bigint>;
    sharePost(postId: bigint): Promise<void>;
    trackAdView(adId: bigint): Promise<void>;
    unbanUser(user: Principal): Promise<void>;
    unfollowUser(userToUnfollow: Principal): Promise<void>;
    unlikePost(postId: bigint): Promise<void>;
    unsavePost(postId: bigint): Promise<void>;
    updateEarningRate(newRate: bigint): Promise<void>;
    updateProfilePicture(storageKey: string): Promise<void>;
    viewPost(postId: bigint): Promise<void>;
}
