import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  public type Car = {
    make : Text;
    model : Text;
    year : Nat;
    mods : [Text];
    hp : Nat;
  };

  public type RaceChallenge = {
    id : Nat;
    challenger : Principal.Principal;
    challenged : Principal.Principal;
    winner : ?Principal.Principal;
    status : ChallengeStatus;
    timestamp : Time.Time;
  };

  public type RaceResult = {
    winner : Principal.Principal;
    loser : Principal.Principal;
    winnerName : Text;
    loserName : Text;
    winnerHp : Nat;
    loserHp : Nat;
    winnerXp : Nat;
    loserXp : Nat;
    challengeId : Nat;
  };

  public type ChallengeStatus = {
    #pending;
    #accepted;
    #declined;
    #completed;
  };

  public type RaceEvent = {
    challenger : Text;
    challenged : Text;
    winner : Text;
    timestamp : Time.Time;
  };

  public type ChatMessage = {
    id : Nat;
    roomId : Text;
    senderName : Text;
    senderId : Text;
    text : Text;
    timestamp : Time.Time;
  };

  public type ChatRoom = {
    id : Text;
    name : Text;
    isCustom : Bool;
    createdBy : Text;
  };

  public type Task = {
    id : Nat;
    title : Text;
    description : Text;
    requiredCompletions : Nat;
    xpReward : Nat;
  };

  public type TaskProgress = {
    currentTaskId : Nat;
    completionsOnCurrentTask : Nat;
  };

  public type DailyProgress = {
    date : Text;
    claimedIndices : [Nat];
  };

  public type XpEvent = {
    raceLabel : Text;
    amount : Nat;
    timestamp : Time.Time;
    streakBonus : Bool;
  };

  var nextChallengeId = 1;
  var nextMessageId = 1;

  let profiles = Map.empty<Principal.Principal, RacerProfile>();
  let cars = Map.empty<Principal.Principal, Car>();
  let challenges = Map.empty<Nat, RaceChallenge>();
  let activity = List.empty<RaceEvent>();
  let chatRooms = Map.empty<Text, ChatRoom>();
  let chatMessages = Map.empty<Text, List.List<ChatMessage>>();
  let roomMembers = Map.empty<Text, Set.Set<Principal.Principal>>();
  let taskProgress = Map.empty<Principal.Principal, TaskProgress>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let xpHistory = Map.empty<Principal.Principal, List.List<XpEvent>>();
  let dailyProgress = Map.empty<Principal.Principal, DailyProgress>();
  let streaks = Map.empty<Principal.Principal, Nat>();

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

  func isDefaultRoom(roomId : Text) : Bool {
    defaultRooms.any(func((id, _)) { id == roomId });
  };

  func addXpEventInternal(userId : Principal.Principal, raceLabel : Text, amount : Nat, streakBonus : Bool) {
    let currentEvent : XpEvent = {
      raceLabel;
      amount;
      timestamp = Time.now();
      streakBonus;
    };

    let oldHistory = switch (xpHistory.get(userId)) {
      case (?history) { history };
      case (null) { List.empty<XpEvent>() };
    };

    oldHistory.add(currentEvent);

    if (oldHistory.size() > 20) {
      let _ = oldHistory.removeLast();
    };

    xpHistory.add(userId, oldHistory);

    let oldStreak = switch (streaks.get(userId)) {
      case (?count) { count };
      case (null) { 0 };
    };
    let newStreak = oldStreak + 1;
    streaks.add(userId, newStreak);
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

  public query ({ caller }) func getAllRacerProfiles() : async [{ principal : Text; profile : RacerProfile }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all profiles");
    };
    profiles.toArray().map(func((p, profile)) { { principal = p.toText(); profile } });
  };

  public query ({ caller }) func searchRacerByName(name : Text) : async [{ principal : Text; profile : RacerProfile }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search racers");
    };

    let nameLower = name.toLower();

    profiles.toArray().filter(
      func((p, profile)) {
        profile.name.toLower().contains(#text(nameLower));
      }
    ).map(func((p, profile)) { { principal = p.toText(); profile } });
  };

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
          xp = existing.xp;
          speed = existing.speed;
        };
      };
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func findRandomOpponent() : async ?{ principal : Text; profile : RacerProfile } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can find opponents");
    };

    var size = profiles.size();
    if (size <= 1) { return null };

    let allProfiles = profiles.toArray();

    var attempts = 0;
    let maxAttempts = 10;
    let randomIndex = Int.abs(Time.now()) % size;

    while (attempts < maxAttempts) {
      let index = (randomIndex + attempts) % size;
      let entry = allProfiles[index];
      if (entry.0 != caller) {
        return ?{
          principal = entry.0.toText();
          profile = entry.1;
        };
      };
      attempts += 1;
    };

    null;
  };

  public shared ({ caller }) func registerCar(make : Text, model : Text, year : Nat, mods : [Text], hp : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register cars");
    };

    let car : Car = {
      make;
      model;
      year;
      mods;
      hp;
    };
    cars.add(caller, car);
  };

  public query ({ caller }) func getCar(owner : Principal.Principal) : async ?Car {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cars");
    };
    cars.get(owner);
  };

  public query ({ caller }) func getCarHp(owner : Principal.Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get car hp");
    };

    switch (cars.get(owner)) {
      case (null) { 150 };
      case (?car) { if (car.hp == 0) { 150 } else { car.hp } };
    };
  };

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

  public shared ({ caller }) func acceptAndRaceChallenge(challengeId : Nat) : async RaceResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept and race challenges");
    };

    let challenge = switch (challenges.get(challengeId)) {
      case (null) { Runtime.trap("Challenge not found") };
      case (?c) { c };
    };

    if (challenge.challenged != caller) {
      Runtime.trap("Unauthorized: You can only accept challenges directed to you");
    };

    if (challenge.status != #pending and challenge.status != #accepted) {
      Runtime.trap("Challenge must be pending or accepted");
    };

    let challengerProfile = switch (profiles.get(challenge.challenger)) {
      case (null) { Runtime.trap("Challenger profile not found") };
      case (?p) { p };
    };

    let challengedProfile = switch (profiles.get(challenge.challenged)) {
      case (null) { Runtime.trap("Challenged profile not found") };
      case (?p) { p };
    };

    let challengerCar = switch (cars.get(challenge.challenger)) {
      case (null) { null };
      case (?car) { ?car };
    };

    let challengedCar = switch (cars.get(challenge.challenged)) {
      case (null) { null };
      case (?car) { ?car };
    };

    let challengerWeight = if (challengerCar != null) {
      (switch (challengerCar) { case (?c) { c.hp }; case (null) { 0 } }) + (challengerProfile.xp / 5);
    } else {
      150 + (challengerProfile.xp / 5);
    };

    let challengedWeight = if (challengedCar != null) {
      (switch (challengedCar) { case (?c) { c.hp }; case (null) { 0 } }) + (challengedProfile.xp / 5);
    } else {
      150 + (challengedProfile.xp / 5);
    };

    let totalWeight = challengerWeight + challengedWeight;
    let roll = (Int.abs(Time.now()) + challengeId) % totalWeight.toInt();

    let challengerWins = roll < challengerWeight.toInt();

    let winner = if (challengerWins) {
      challenge.challenger;
    } else {
      challenge.challenged;
    };
    let loser = if (challengerWins) {
      challenge.challenged;
    } else {
      challenge.challenger;
    };

    let winnerProfile = switch (profiles.get(winner)) {
      case (null) { Runtime.trap("Winner profile not found") };
      case (?p) { p };
    };
    let loserProfile = switch (profiles.get(loser)) {
      case (null) { Runtime.trap("Loser profile not found") };
      case (?p) { p };
    };

    let winnerCar = switch (cars.get(winner)) {
      case (null) { null };
      case (?car) { ?car };
    };
    let loserCar = switch (cars.get(loser)) {
      case (null) { null };
      case (?car) { ?car };
    };

    let winnerHp = switch (winnerCar) {
      case (null) { 150 };
      case (?car) { car.hp };
    };

    let loserHp = switch (loserCar) {
      case (null) { 150 };
      case (?car) { car.hp };
    };

    let winnerProfileUpdated : RacerProfile = {
      winnerProfile with
      wins = winnerProfile.wins + 1;
      reputation = winnerProfile.reputation + 10;
      xp = winnerProfile.xp + 75;
    };

    let loserProfileUpdated : RacerProfile = {
      loserProfile with
      losses = loserProfile.losses + 1;
      reputation = loserProfile.reputation - 5;
      xp = loserProfile.xp + 20;
    };

    let updated = {
      challenge with
      winner = ?winner;
      status = #completed;
    };
    challenges.add(challengeId, updated);

    profiles.add(winner, winnerProfileUpdated);
    profiles.add(loser, loserProfileUpdated);

    let raceEvent : RaceEvent = {
      challenger = challengerProfile.name;
      challenged = challengedProfile.name;
      winner = winnerProfile.name;
      timestamp = Time.now();
    };

    activity.add(raceEvent);
    while (activity.size() > 20) {
      let _ = activity.removeLast();
    };

    addXpEventInternal(winner, "Race Win", 75, false);
    addXpEventInternal(loser, "Race Loss", 20, false);

    {
      winner;
      loser;
      winnerName = winnerProfile.name;
      loserName = loserProfile.name;
      winnerHp;
      loserHp;
      winnerXp = winnerProfileUpdated.xp;
      loserXp = loserProfileUpdated.xp;
      challengeId;
    };
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

    if (newCompletions >= currentTask.requiredCompletions) {
      if (currentTaskIndex + 1 < tasksList.size()) {
        let nextTaskProgress : TaskProgress = {
          currentTaskId = currentTaskIndex + 1;
          completionsOnCurrentTask = 0;
        };
        taskProgress.add(caller, nextTaskProgress);
      } else {
        let maxProgress : TaskProgress = {
          currentTaskId = currentTaskIndex;
          completionsOnCurrentTask = currentTask.requiredCompletions;
        };
        taskProgress.add(caller, maxProgress);
      };
    } else {
      let updatedProgress : TaskProgress = {
        currentTaskId = currentTaskIndex;
        completionsOnCurrentTask = newCompletions;
      };
      taskProgress.add(caller, updatedProgress);
    };

    profiles.add(caller, updatedProfile);

    addXpEventInternal(caller, currentTask.title, currentTask.xpReward, false);

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

  public shared ({ caller }) func sendChatMessage(roomId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
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

    let members = Set.empty<Principal.Principal>();
    roomMembers.add(name, members);
  };

  public shared ({ caller }) func deleteChatRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete chat rooms");
    };

    let room = switch (chatRooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (not room.isCustom) { Runtime.trap("Cannot delete a default room") };
        if (room.createdBy != caller.toText()) {
          Runtime.trap("Unauthorized: Only the creator can delete this room");
        };
        room;
      };
    };

    chatRooms.remove(roomId);
    chatMessages.remove(roomId);
    roomMembers.remove(roomId);
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

    let filteredCustomRooms = customRooms.filter(
      func(room) {
        not defaultRoomEntries.any(
          func(defRoom) {
            defRoom.id == room.id;
          }
        );
      }
    );

    defaultRoomEntries.concat(filteredCustomRooms);
  };

  public shared ({ caller }) func joinRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };

    if (not isDefaultRoom(roomId) and not chatRooms.containsKey(roomId)) {
      Runtime.trap("Room does not exist");
    };

    let members = switch (roomMembers.get(roomId)) {
      case (null) {
        let newMembers = Set.empty<Principal.Principal>();
        roomMembers.add(roomId, newMembers);
        newMembers;
      };
      case (?m) { m };
    };

    if (members.size() >= 20) {
      Runtime.trap("Room has reached the maximum number of members");
    };

    members.add(caller);
  };

  public shared ({ caller }) func leaveRoom(roomId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave rooms");
    };

    let members = switch (roomMembers.get(roomId)) {
      case (null) { Runtime.trap("You are not a member of this room") };
      case (?m) { m };
    };

    if (not members.contains(caller)) {
      Runtime.trap("You are not a member of this room");
    };

    members.remove(caller);

    if (members.isEmpty()) {
      roomMembers.remove(roomId);
    };
  };

  public query ({ caller }) func getRoomMembers(roomId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view members");
    };

    switch (roomMembers.get(roomId)) {
      case (null) { 0 };
      case (?members) { members.size() };
    };
  };

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

      if (not roomMembers.containsKey(roomId)) {
        roomMembers.add(roomId, Set.empty<Principal.Principal>());
      };
    };
  };

  public query ({ caller }) func getXpHistory() : async [XpEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view xp history");
    };

    switch (xpHistory.get(caller)) {
      case (null) { [] };
      case (?history) { history.toArray() };
    };
  };

  public shared ({ caller }) func addXpEvent(raceLabel : Text, amount : Nat, streakBonus : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add xp events");
    };
    addXpEventInternal(caller, raceLabel, amount, streakBonus);
  };

  public query ({ caller }) func getDailyProgress(date : Text) : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view daily progress");
    };

    switch (dailyProgress.get(caller)) {
      case (null) { [] };
      case (?progress) {
        if (progress.date == date) {
          progress.claimedIndices;
        } else { [] };
      };
    };
  };

  public shared ({ caller }) func claimDailyChallenge(date : Text, idx : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim challenges");
    };

    let currentProgress = switch (dailyProgress.get(caller)) {
      case (null) {
        {
          date;
          claimedIndices = [idx];
        };
      };
      case (?d) {
        if (d.date == date) {
          let seenIndices = d.claimedIndices.map(func(i) { i });
          if (seenIndices.any(func(i) { i == idx })) {
            { date; claimedIndices = d.claimedIndices };
          } else {
            { date; claimedIndices = d.claimedIndices.concat([idx]) };
          };
        } else {
          {
            date;
            claimedIndices = [idx];
          };
        };
      };
    };
    dailyProgress.add(caller, currentProgress);
  };

  public query ({ caller }) func getStreak() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get streaks");
    };

    switch (streaks.get(caller)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };
};
