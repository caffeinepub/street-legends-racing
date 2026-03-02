import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  public type RacerProfile = {
    name : Text;
    bio : Text;
    avatarUrl : ?Text;
    wins : Nat;
    losses : Nat;
    reputation : Int;
    xp : Nat;
    speed : Nat;
  };

  module RacerProfile {
    public func compareByReputation(profile1 : RacerProfile, profile2 : RacerProfile) : Order.Order {
      Int.compare(profile2.reputation, profile1.reputation);
    };
  };

  type Car = {
    make : Text;
    model : Text;
    year : Nat;
    mods : [Text];
  };

  type RaceChallenge = {
    id : Nat;
    challenger : Principal.Principal;
    challenged : Principal.Principal;
    winner : ?Principal.Principal;
    status : ChallengeStatus;
    timestamp : Time.Time;
  };

  type ChallengeStatus = {
    #pending;
    #accepted;
    #declined;
    #completed;
  };

  type RaceEvent = {
    challenger : Text;
    challenged : Text;
    winner : Text;
    timestamp : Time.Time;
  };

  // Chat Types
  type ChatMessage = {
    id : Nat;
    roomId : Text;
    senderName : Text;
    senderId : Text;
    text : Text;
    timestamp : Time.Time;
  };

  type ChatRoom = {
    id : Text;
    name : Text;
    isCustom : Bool;
    createdBy : Text;
  };

  // Task progression types
  type Task = {
    id : Nat;
    title : Text;
    description : Text;
    requiredCompletions : Nat;
    xpReward : Nat;
  };

  type TaskProgress = {
    currentTaskId : Nat;
    completionsOnCurrentTask : Nat;
  };

  // State
  var nextChallengeId = 1;
  var nextMessageId = 1;

  let profiles = Map.empty<Principal.Principal, RacerProfile>();
  let cars = Map.empty<Principal.Principal, Car>();
  let challenges = Map.empty<Nat, RaceChallenge>();
  let activity = List.empty<RaceEvent>();
  let chatRooms = Map.empty<Text, ChatRoom>();
  let chatMessages = Map.empty<Text, List.List<ChatMessage>>();
  let sampleRacers = Set.empty<Principal.Principal>();
  let taskProgress = Map.empty<Principal.Principal, TaskProgress>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Default rooms
  let defaultRooms = [
    ("pink_slip_alley", "Pink Slip Alley"),
    ("quarter_mile", "Quarter Mile"),
    ("midnight_runners", "Midnight Runners"),
    ("no_mercy_lane", "No Mercy Lane"),
    ("street_kings", "Street Kings"),
    ("dyno_room", "Dyno Room"),
    ("roll_racing", "Roll Racing"),
    ("import_invaders", "Import Invaders"),
    ("muscle_row", "Muscle Row"),
    ("underground", "Underground"),
  ];

  // Hardcoded list of sequential tasks
  let tasksList : [Task] = [
    {
      id = 0;
      title = "Rev Your Engine";
      description = "Rev your car in the lot";
      requiredCompletions = 3;
      xpReward = 50;
    },
    {
      id = 1;
      title = "First Burnout";
      description = "Leave a mark on the asphalt";
      requiredCompletions = 3;
      xpReward = 75;
    },
    {
      id = 2;
      title = "Beat a Newcomer";
      description = "Win against a fresh racer";
      requiredCompletions = 5;
      xpReward = 100;
    },
    {
      id = 3;
      title = "Hit the Quarter Mile";
      description = "Run a clean quarter mile";
      requiredCompletions = 5;
      xpReward = 125;
    },
    {
      id = 4;
      title = "Earn Your Stripes";
      description = "Win 3 races in a row";
      requiredCompletions = 3;
      xpReward = 150;
    },
    {
      id = 5;
      title = "Pink Slip Challenge";
      description = "Race for a pink slip";
      requiredCompletions = 5;
      xpReward = 200;
    },
    {
      id = 6;
      title = "Midnight Run";
      description = "Race after midnight";
      requiredCompletions = 5;
      xpReward = 225;
    },
    {
      id = 7;
      title = "Beat a Known Racer";
      description = "Win against someone with reputation";
      requiredCompletions = 5;
      xpReward = 275;
    },
    {
      id = 8;
      title = "Drift Master";
      description = "Pull a clean drift";
      requiredCompletions = 5;
      xpReward = 300;
    },
    {
      id = 9;
      title = "Podium Finisher";
      description = "Place top 3 on leaderboard";
      requiredCompletions = 3;
      xpReward = 400;
    },
    {
      id = 10;
      title = "Street Dominator";
      description = "Win 10 races total";
      requiredCompletions = 1;
      xpReward = 500;
    },
    {
      id = 11;
      title = "King's Challenge";
      description = "Beat the current top racer";
      requiredCompletions = 3;
      xpReward = 1000;
    },
  ];

  // Allow external migration of default rooms - admin only
  public shared ({ caller }) func migrateDefaultRooms() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can migrate default rooms");
    };

    for ((roomId, roomName) in defaultRooms.values()) {
      let room = {
        id = roomId;
        name = roomName;
        isCustom = false;
        createdBy = "system";
      };
      chatRooms.add(roomId, room);
      if (not chatMessages.containsKey(roomId)) {
        chatMessages.add(roomId, List.empty<ChatMessage>());
      };
    };
  };

  // Profile management
  public shared ({ caller }) func saveCallerUserProfile(profileData : RacerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = profiles.get(caller);
    let profile : RacerProfile = switch (existingProfile) {
      case (null) {
        {
          profileData with
          wins = 0;
          losses = 0;
          reputation = 100;
          xp = profileData.xp;
          speed = profileData.speed;
        };
      };
      case (?existing) {
        {
          profileData with
          wins = existing.wins;
          losses = existing.losses;
          reputation = existing.reputation;
          xp = profileData.xp;
          speed = profileData.speed;
        };
      };
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func completeTask() : async RacerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    let currentProfile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };

    let currentProgress = switch (taskProgress.get(caller)) {
      case (null) { { currentTaskId = 0; completionsOnCurrentTask = 0 } };
      case (?progress) { progress };
    };

    let currentTaskIndex = if (currentProgress.currentTaskId >= tasksList.size()) {
      tasksList.size() - 1;
    } else { currentProgress.currentTaskId };
    let currentTask = tasksList[currentTaskIndex];

    let newXp = currentProfile.xp + currentTask.xpReward;
    let newSpeed = newXp / 10;

    let updatedProfile : RacerProfile = {
      currentProfile with
      xp = newXp;
      speed = newSpeed;
    };

    let newCompletions = currentProgress.completionsOnCurrentTask + 1;

    // Check if task is completed and advance if needed
    if (newCompletions >= currentTask.requiredCompletions) {
      if (currentTaskIndex + 1 < tasksList.size()) {
        // Advance to next task
        let nextTaskProgress : TaskProgress = {
          currentTaskId = currentTaskIndex + 1;
          completionsOnCurrentTask = 0;
        };
        taskProgress.add(caller, nextTaskProgress);
      } else {
        // Already at max task, stay there
        let maxProgress : TaskProgress = {
          currentTaskId = currentTaskIndex;
          completionsOnCurrentTask = currentTask.requiredCompletions;
        };
        taskProgress.add(caller, maxProgress);
      };
    } else {
      // Still working on current task
      let updatedProgress : TaskProgress = {
        currentTaskId = currentTaskIndex;
        completionsOnCurrentTask = newCompletions;
      };
      taskProgress.add(caller, updatedProgress);
    };

    profiles.add(caller, updatedProfile);
    updatedProfile;
  };

  public query ({ caller }) func getTaskProgress() : async {
    currentTaskId : Nat;
    completionsOnCurrentTask : Nat;
    tasks : [Task];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get task progress");
    };

    let progress = switch (taskProgress.get(caller)) {
      case (null) { { currentTaskId = 0; completionsOnCurrentTask = 0 } };
      case (?p) { p };
    };

    {
      currentTaskId = progress.currentTaskId;
      completionsOnCurrentTask = progress.completionsOnCurrentTask;
      tasks = tasksList;
    };
  };

  public query ({ caller }) func getAllRacerProfiles() : async [{ principal : Text; profile : RacerProfile }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all profiles");
    };

    profiles.toArray().map(func((p, profile)) { { principal = p.toText(); profile } });
  };

  public query ({ caller }) func getCallerUserProfile() : async ?RacerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?RacerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(user);
  };

  // Car management
  public shared ({ caller }) func registerCar(make : Text, model : Text, year : Nat, mods : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register cars");
    };

    let car : Car = {
      make;
      model;
      year;
      mods;
    };
    cars.add(caller, car);
  };

  public query ({ caller }) func getCar(owner : Principal.Principal) : async ?Car {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cars");
    };
    cars.get(owner);
  };

  // Race challenges
  public shared ({ caller }) func createChallenge(challenged : Principal.Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create challenges");
    };

    let challenge : RaceChallenge = {
      id = nextChallengeId;
      challenger = caller;
      challenged;
      winner = null;
      status = #pending;
      timestamp = Time.now();
    };
    challenges.add(nextChallengeId, challenge);
    nextChallengeId += 1;
    challenge.id;
  };

  public shared ({ caller }) func acceptChallenge(challengeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept challenges");
    };
    let challenge = switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?c) { c };
    };

    if (challenge.challenged != caller) {
      Runtime.trap("Unauthorized: You can only accept challenges directed to you");
    };

    if (challenge.status != #pending) {
      Runtime.trap("Challenge no longer pending");
    };

    let updated = {
      challenge with
      status = #accepted;
    };
    challenges.add(challengeId, updated);
  };

  public shared ({ caller }) func completeChallenge(challengeId : Nat, winner : Principal.Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can complete challenges");
    };

    let challenge = switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?c) { c };
    };

    if (challenge.status != #accepted) {
      Runtime.trap("Challenge must be accepted before completion");
    };

    if (winner != challenge.challenger and winner != challenge.challenged) {
      Runtime.trap("Winner must be one of the challenge participants");
    };

    let loser = if (winner == challenge.challenger) {
      challenge.challenged;
    } else {
      challenge.challenger;
    };

    func updateStats(user : Principal.Principal, isWinner : Bool) {
      let oldProfile = switch (profiles.get(user)) {
        case (null) { Runtime.trap("Profile not found") };
        case (?p) { p };
      };
      let reputationChange = if (isWinner) { 10 } else { -5 };
      let updatedProfile : RacerProfile = {
        oldProfile with
        wins = if (isWinner) { oldProfile.wins + 1 } else {
          oldProfile.wins;
        };
        losses = if (not isWinner) { oldProfile.losses + 1 } else {
          oldProfile.losses;
        };
        reputation = oldProfile.reputation + reputationChange;
      };
      profiles.add(user, updatedProfile);
    };

    updateStats(winner, true);
    updateStats(loser, false);

    let updated = {
      challenge with
      winner = ?winner;
      status = #completed;
    };
    challenges.add(challengeId, updated);

    let raceEvent : RaceEvent = {
      challenger = (switch (profiles.get(challenge.challenger)) {
        case (null) { "" };
        case (?p) { p.name };
      });
      challenged = (switch (profiles.get(challenge.challenged)) {
        case (null) { "" };
        case (?p) { p.name };
      });
      winner = (switch (profiles.get(winner)) {
        case (null) { "" };
        case (?p) { p.name };
      });
      timestamp = Time.now();
    };

    activity.add(raceEvent);

    while (activity.size() > 20) {
      let _ = activity.removeLast();
    };
  };

  // Public endpoints - require user authentication
  public query ({ caller }) func getLeaderboard() : async [RacerProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leaderboard");
    };
    profiles.values().toArray().sort(RacerProfile.compareByReputation);
  };

  public query ({ caller }) func getActivityFeed() : async [RaceEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activity feed");
    };
    activity.toArray();
  };

  public query ({ caller }) func getIncomingChallenges() : async [RaceChallenge] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view challenges");
    };

    challenges.values().toArray().filter(
      func(challenge) {
        challenge.challenged == caller
      }
    );
  };

  public query ({ caller }) func getOutgoingChallenges() : async [RaceChallenge] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view challenges");
    };

    challenges.values().toArray().filter(
      func(challenge) {
        challenge.challenger == caller
      }
    );
  };

  // Chat Functionality

  public shared ({ caller }) func sendChatMessage(roomId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };

    if (not chatRooms.containsKey(roomId)) {
      Runtime.trap("Chat room does not exist");
    };

    let message : ChatMessage = {
      id = nextMessageId;
      roomId;
      senderName = profile.name;
      senderId = caller.toText();
      text;
      timestamp = Time.now();
    };

    let messages = switch (chatMessages.get(roomId)) {
      case (null) { List.empty<ChatMessage>() };
      case (?msgList) { msgList };
    };
    messages.add(message);

    while (messages.size() > 100) {
      let _ = messages.removeLast();
    };

    chatMessages.add(roomId, messages);

    nextMessageId += 1;
  };

  public query ({ caller }) func getChatMessages(roomId : Text) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };
    switch (chatMessages.get(roomId)) {
      case (null) { [] };
      case (?messages) { messages.toArray() };
    };
  };

  public shared ({ caller }) func createChatRoom(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create chat rooms");
    };

    let room : ChatRoom = {
      id = name;
      name;
      isCustom = true;
      createdBy = caller.toText();
    };

    chatRooms.add(name, room);
    let newMessages = List.empty<ChatMessage>();
    chatMessages.add(name, newMessages);
  };

  public query ({ caller }) func getChatRooms() : async [ChatRoom] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat rooms");
    };

    let defaultRoomEntries = defaultRooms.map(
      func((roomId, roomName)) {
        {
          id = roomId;
          name = roomName;
          isCustom = false;
          createdBy = "system";
        };
      }
    );

    let customRooms = chatRooms.toArray().map(
      func((_, room)) { room }
    );

    defaultRoomEntries.concat(customRooms);
  };
};
