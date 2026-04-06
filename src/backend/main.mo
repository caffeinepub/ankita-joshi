import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Text "mo:core/Text";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  // Integrate prefabricated mixins
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ===== USER PROFILE TYPES =====
  
  public type UserRole = {
    #user;
    #admin;
  };

  public type UserProfile = {
    name : Text;
    username : Text;
    bio : Text;
    profilePicture : ?Text; // blob storage key
    followers : [Principal];
    following : [Principal];
    walletBalance : Nat;
    totalEarnings : Nat;
    role : UserRole;
  };

  // ===== POST TYPES =====
  
  public type PostType = {
    #image;
    #video;
    #reel;
  };

  public type Comment = {
    id : Nat;
    author : Principal;
    content : Text;
    timestamp : Nat;
    replies : [Comment];
  };

  public type Post = {
    id : Nat;
    author : Principal;
    caption : Text;
    mediaUrl : Text;
    postType : PostType;
    likes : [Principal];
    comments : [Comment];
    shares : Nat;
    saves : [Principal];
    views : [Principal]; // unique viewers
    timestamp : Nat;
  };

  // ===== NOTIFICATION TYPES =====
  
  public type NotificationType = {
    #like;
    #comment;
    #follow;
    #friendRequest;
  };

  public type Notification = {
    id : Nat;
    recipient : Principal;
    sender : Principal;
    notifType : NotificationType;
    postId : ?Nat;
    message : Text;
    read : Bool;
    timestamp : Nat;
  };

  // ===== FRIEND REQUEST TYPES =====
  
  public type FriendRequestStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  public type FriendRequest = {
    id : Nat;
    from : Principal;
    to : Principal;
    status : FriendRequestStatus;
    timestamp : Nat;
  };

  // ===== WITHDRAWAL TYPES =====
  
  public type WithdrawalMethod = {
    #upi : Text;
    #bank : { accountNumber : Text; ifsc : Text };
  };

  public type WithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type Withdrawal = {
    id : Nat;
    user : Principal;
    amount : Nat;
    method : WithdrawalMethod;
    status : WithdrawalStatus;
    timestamp : Nat;
  };

  // ===== AD TYPES =====
  
  public type Ad = {
    id : Nat;
    title : Text;
    imageUrl : Text;
    targetUrl : Text;
    views : Nat;
    active : Bool;
  };

  // ===== STATE =====
  
  let userProfiles = Map.empty<Principal, UserProfile>();
  let posts = Map.empty<Nat, Post>();
  let notifications = Map.empty<Nat, Notification>();
  let friendRequests = Map.empty<Nat, FriendRequest>();
  let withdrawals = Map.empty<Nat, Withdrawal>();
  let ads = Map.empty<Nat, Ad>();
  let bannedUsers = Map.empty<Principal, Bool>();
  
  var postIdCounter : Nat = 0;
  var notificationIdCounter : Nat = 0;
  var friendRequestIdCounter : Nat = 0;
  var withdrawalIdCounter : Nat = 0;
  var adIdCounter : Nat = 0;
  var commentIdCounter : Nat = 0;
  var earningRatePer1000Views : Nat = 10; // 10 INR per 1000 views
  var timestampCounter : Nat = 0; // Simple timestamp simulation

  // ===== REQUIRED PROFILE FUNCTIONS =====

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Anyone can view user profiles (public social media)
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    
    // Preserve certain fields that shouldn't be directly modified
    switch (userProfiles.get(caller)) {
      case (?existing) {
        let updated : UserProfile = {
          name = profile.name;
          username = profile.username;
          bio = profile.bio;
          profilePicture = profile.profilePicture;
          followers = existing.followers; // Preserve followers
          following = existing.following; // Preserve following
          walletBalance = existing.walletBalance; // Preserve wallet
          totalEarnings = existing.totalEarnings; // Preserve earnings
          role = existing.role; // Preserve role
        };
        userProfiles.add(caller, updated);
      };
      case null {
        // New profile - initialize with defaults
        let newProfile : UserProfile = {
          name = profile.name;
          username = profile.username;
          bio = profile.bio;
          profilePicture = profile.profilePicture;
          followers = [];
          following = [];
          walletBalance = 0;
          totalEarnings = 0;
          role = #user;
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  // ===== USER MANAGEMENT =====

  public shared ({ caller }) func createUserProfile(name : Text, username : Text, bio : Text) : async () {
    // Anyone can create a profile (including guests becoming users)
    if (userProfiles.get(caller) != null) {
      Runtime.trap("User profile already exists");
    };
    
    let newProfile : UserProfile = {
      name;
      username;
      bio;
      profilePicture = null;
      followers = [];
      following = [];
      walletBalance = 0;
      totalEarnings = 0;
      role = #user;
    };
    userProfiles.add(caller, newProfile);
  };

  public shared ({ caller }) func updateProfilePicture(storageKey : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile pictures");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updated = { profile with profilePicture = ?storageKey };
        userProfiles.add(caller, updated);
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  // ===== POST MANAGEMENT =====

  public shared ({ caller }) func createPost(caption : Text, mediaUrl : Text, postType : PostType) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    
    if (bannedUsers.get(caller) == ?true) {
      Runtime.trap("Unauthorized: Banned users cannot create posts");
    };
    
    postIdCounter += 1;
    timestampCounter += 1;
    
    let newPost : Post = {
      id = postIdCounter;
      author = caller;
      caption;
      mediaUrl;
      postType;
      likes = [];
      comments = [];
      shares = 0;
      saves = [];
      views = [];
      timestamp = timestampCounter;
    };
    
    posts.add(postIdCounter, newPost);
    postIdCounter;
  };

  public shared ({ caller }) func deletePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        // Users can delete their own posts, admins can delete any post
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own posts");
        };
        posts.remove(postId);
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public query ({ caller }) func getPost(postId : Nat) : async ?Post {
    posts.get(postId);
  };

  public query ({ caller }) func getUserPosts(user : Principal) : async [Post] {
    posts.values().filter(func(post) { post.author == user }).toArray();
  };

  public query ({ caller }) func getFeedPosts() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feed");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        // Get posts from followed users + trending posts (high views)
        let followedPosts = posts.values().filter(func(post) {
          profile.following.any(func(p) { p == post.author });
        });
        
        let trendingPosts = posts.values().filter(func(post) {
          post.views.size() > 100 // Simple trending logic
        });
        
        // Combine and deduplicate
        let allPosts = followedPosts.toArray().concat(trendingPosts.toArray());
        allPosts;
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  // ===== SOCIAL INTERACTIONS =====

  public shared ({ caller }) func followUser(userToFollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    
    if (caller == userToFollow) {
      Runtime.trap("Cannot follow yourself");
    };
    
    switch (userProfiles.get(caller)) {
      case (?myProfile) {
        if (myProfile.following.any(func(p) { p == userToFollow })) {
          Runtime.trap("Already following this user");
        };
        
        let updatedFollowing = myProfile.following.concat([userToFollow]);
        let updated = { myProfile with following = updatedFollowing };
        userProfiles.add(caller, updated);
        
        // Update target user's followers
        switch (userProfiles.get(userToFollow)) {
          case (?targetProfile) {
            let updatedFollowers = targetProfile.followers.concat([caller]);
            let updatedTarget = { targetProfile with followers = updatedFollowers };
            userProfiles.add(userToFollow, updatedTarget);
            
            // Create notification
            createNotificationInternal(userToFollow, caller, #follow, null, "started following you");
          };
          case null {
            Runtime.trap("User to follow not found");
          };
        };
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func unfollowUser(userToUnfollow : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    
    switch (userProfiles.get(caller)) {
      case (?myProfile) {
        let updatedFollowing = myProfile.following.filter(func(p) { p != userToUnfollow });
        let updated = { myProfile with following = updatedFollowing };
        userProfiles.add(caller, updated);
        
        // Update target user's followers
        switch (userProfiles.get(userToUnfollow)) {
          case (?targetProfile) {
            let updatedFollowers = targetProfile.followers.filter(func(p) { p != caller });
            let updatedTarget = { targetProfile with followers = updatedFollowers };
            userProfiles.add(userToUnfollow, updatedTarget);
          };
          case null {};
        };
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };
    
    if (caller == to) {
      Runtime.trap("Cannot send friend request to yourself");
    };
    
    friendRequestIdCounter += 1;
    timestampCounter += 1;
    
    let request : FriendRequest = {
      id = friendRequestIdCounter;
      from = caller;
      to;
      status = #pending;
      timestamp = timestampCounter;
    };
    
    friendRequests.add(friendRequestIdCounter, request);
    createNotificationInternal(to, caller, #friendRequest, null, "sent you a friend request");
    friendRequestIdCounter;
  };

  public shared ({ caller }) func acceptFriendRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };
    
    switch (friendRequests.get(requestId)) {
      case (?request) {
        if (request.to != caller) {
          Runtime.trap("Unauthorized: Can only accept requests sent to you");
        };
        
        let updated = { request with status = #accepted };
        friendRequests.add(requestId, updated);
      };
      case null {
        Runtime.trap("Friend request not found");
      };
    };
  };

  public shared ({ caller }) func rejectFriendRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reject friend requests");
    };
    
    switch (friendRequests.get(requestId)) {
      case (?request) {
        if (request.to != caller) {
          Runtime.trap("Unauthorized: Can only reject requests sent to you");
        };
        
        let updated = { request with status = #rejected };
        friendRequests.add(requestId, updated);
      };
      case null {
        Runtime.trap("Friend request not found");
      };
    };
  };

  public query ({ caller }) func getFriendRequests() : async [FriendRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friend requests");
    };
    
    friendRequests.values().filter(func(req) {
      req.to == caller and req.status == #pending
    }).toArray();
  };

  public query ({ caller }) func getUserSuggestions() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view suggestions");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        userProfiles.keys().filter(func(p) {
          p != caller and not profile.following.any(func(f) { f == p });
        }).toArray();
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  // ===== POST INTERACTIONS =====

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        if (post.likes.any(func(p) { p == caller })) {
          Runtime.trap("Already liked this post");
        };
        
        let updatedLikes = post.likes.concat([caller]);
        let updated = { post with likes = updatedLikes };
        posts.add(postId, updated);
        
        if (post.author != caller) {
          createNotificationInternal(post.author, caller, #like, ?postId, "liked your post");
        };
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        let updatedLikes = post.likes.filter(func(p) { p != caller });
        let updated = { post with likes = updatedLikes };
        posts.add(postId, updated);
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        commentIdCounter += 1;
        timestampCounter += 1;
        
        let newComment : Comment = {
          id = commentIdCounter;
          author = caller;
          content;
          timestamp = timestampCounter;
          replies = [];
        };
        
        let updatedComments = post.comments.concat([newComment]);
        let updated = { post with comments = updatedComments };
        posts.add(postId, updated);
        
        if (post.author != caller) {
          createNotificationInternal(post.author, caller, #comment, ?postId, "commented on your post");
        };
        
        commentIdCounter;
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func savePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        if (post.saves.any(func(p) { p == caller })) {
          Runtime.trap("Already saved this post");
        };
        
        let updatedSaves = post.saves.concat([caller]);
        let updated = { post with saves = updatedSaves };
        posts.add(postId, updated);
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func unsavePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unsave posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        let updatedSaves = post.saves.filter(func(p) { p != caller });
        let updated = { post with saves = updatedSaves };
        posts.add(postId, updated);
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func sharePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can share posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        let updated = { post with shares = post.shares + 1 };
        posts.add(postId, updated);
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  public shared ({ caller }) func viewPost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view posts");
    };
    
    switch (posts.get(postId)) {
      case (?post) {
        // Track unique views
        if (not post.views.any(func(p) { p == caller })) {
          let updatedViews = post.views.concat([caller]);
          let updated = { post with views = updatedViews };
          posts.add(postId, updated);
          
          // Update author earnings
          updatePostEarnings(post.author, updatedViews.size());
        };
      };
      case null {
        Runtime.trap("Post not found");
      };
    };
  };

  // ===== NOTIFICATIONS =====

  func createNotificationInternal(recipient : Principal, sender : Principal, notifType : NotificationType, postId : ?Nat, message : Text) {
    notificationIdCounter += 1;
    timestampCounter += 1;
    
    let notification : Notification = {
      id = notificationIdCounter;
      recipient;
      sender;
      notifType;
      postId;
      message;
      read = false;
      timestamp = timestampCounter;
    };
    
    notifications.add(notificationIdCounter, notification);
  };

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    
    notifications.values().filter(func(n) { n.recipient == caller }).toArray();
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    
    switch (notifications.get(notificationId)) {
      case (?notification) {
        if (notification.recipient != caller) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        
        let updated = { notification with read = true };
        notifications.add(notificationId, updated);
      };
      case null {
        Runtime.trap("Notification not found");
      };
    };
  };

  // ===== MONETIZATION =====

  func updatePostEarnings(author : Principal, totalViews : Nat) {
    switch (userProfiles.get(author)) {
      case (?profile) {
        let earnings = (totalViews * earningRatePer1000Views) / 1000;
        let viralBonus = if (totalViews > 10000) { 100 } else { 0 };
        let totalEarnings = earnings + viralBonus;
        
        let updated = {
          profile with
          walletBalance = profile.walletBalance + totalEarnings;
          totalEarnings = profile.totalEarnings + totalEarnings;
        };
        userProfiles.add(author, updated);
      };
      case null {};
    };
  };

  public query ({ caller }) func getWalletBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.walletBalance };
      case null { 0 };
    };
  };

  // ===== WITHDRAWALS =====

  public shared ({ caller }) func requestWithdrawal(amount : Nat, method : WithdrawalMethod) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };
    
    if (amount < 100) {
      Runtime.trap("Minimum withdrawal amount is 100 INR");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.walletBalance < amount) {
          Runtime.trap("Insufficient balance");
        };
        
        withdrawalIdCounter += 1;
        timestampCounter += 1;
        
        let withdrawal : Withdrawal = {
          id = withdrawalIdCounter;
          user = caller;
          amount;
          method;
          status = #pending;
          timestamp = timestampCounter;
        };
        
        withdrawals.add(withdrawalIdCounter, withdrawal);
        
        // Deduct from wallet
        let updated = { profile with walletBalance = profile.walletBalance - amount };
        userProfiles.add(caller, updated);
        
        withdrawalIdCounter;
      };
      case null {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func approveWithdrawal(withdrawalId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };
    
    switch (withdrawals.get(withdrawalId)) {
      case (?withdrawal) {
        let updated = { withdrawal with status = #approved };
        withdrawals.add(withdrawalId, updated);
      };
      case null {
        Runtime.trap("Withdrawal not found");
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawal(withdrawalId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };
    
    switch (withdrawals.get(withdrawalId)) {
      case (?withdrawal) {
        let updated = { withdrawal with status = #rejected };
        withdrawals.add(withdrawalId, updated);
        
        // Refund to wallet
        switch (userProfiles.get(withdrawal.user)) {
          case (?profile) {
            let refunded = { profile with walletBalance = profile.walletBalance + withdrawal.amount };
            userProfiles.add(withdrawal.user, refunded);
          };
          case null {};
        };
      };
      case null {
        Runtime.trap("Withdrawal not found");
      };
    };
  };

  public query ({ caller }) func getPendingWithdrawals() : async [Withdrawal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending withdrawals");
    };
    
    withdrawals.values().filter(func(w) { w.status == #pending }).toArray();
  };

  // ===== ADS =====

  public shared ({ caller }) func createAd(title : Text, imageUrl : Text, targetUrl : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create ads");
    };
    
    adIdCounter += 1;
    
    let ad : Ad = {
      id = adIdCounter;
      title;
      imageUrl;
      targetUrl;
      views = 0;
      active = true;
    };
    
    ads.add(adIdCounter, ad);
    adIdCounter;
  };

  public query ({ caller }) func getAds() : async [Ad] {
    // Anyone can view ads
    ads.values().filter(func(ad) { ad.active }).toArray();
  };

  public shared ({ caller }) func trackAdView(adId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view ads");
    };
    
    switch (ads.get(adId)) {
      case (?ad) {
        let updated = { ad with views = ad.views + 1 };
        ads.add(adId, updated);
      };
      case null {
        Runtime.trap("Ad not found");
      };
    };
  };

  // ===== ADMIN FUNCTIONS =====

  public shared ({ caller }) func banUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };
    
    bannedUsers.add(user, true);
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unban users");
    };
    bannedUsers.remove(user);
  };

  public shared ({ caller }) func updateEarningRate(newRate : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update earning rate");
    };
    
    earningRatePer1000Views := newRate;
  };

  public query ({ caller }) func getAdminStats() : async {
    totalUsers : Nat;
    totalPosts : Nat;
    totalEarningsPaid : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view stats");
    };

    {
      totalUsers = userProfiles.size();
      totalPosts = posts.size();
      totalEarningsPaid = 0;
    };
  };

  public query ({ caller }) func getAllWithdrawals() : async [Withdrawal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all withdrawals");
    };
    
    withdrawals.values().toArray();
  };
};
