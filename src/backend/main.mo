import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  include MixinStorage();

  // Types
  type RacerProfile = {
    name : Text;
    bio : Text;
    avatarUrl : ?Text;
    wins : Nat;
    losses : Nat;
    reputation : Int;
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

  // State
  var nextChallengeId = 1;
  let profiles = Map.empty<Principal.Principal, RacerProfile>();
  let cars = Map.empty<Principal.Principal, Car>();
  let challenges = Map.empty<Nat, RaceChallenge>();
  let activity = List.empty<RaceEvent>();
  let sampleRacers = Set.empty<Principal.Principal>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Profile management
  public shared ({ caller }) func saveCallerUserProfile(name : Text, bio : Text, avatarUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Preserve existing wins/losses/reputation if profile exists
    let existingProfile = profiles.get(caller);
    let profile : RacerProfile = switch (existingProfile) {
      case (null) {
        // New profile - use defaults
        {
          name;
          bio;
          avatarUrl;
          wins = 0;
          losses = 0;
          reputation = 100;
        };
      };
      case (?existing) {
        // Existing profile - preserve stats
        {
          name;
          bio;
          avatarUrl;
          wins = existing.wins;
          losses = existing.losses;
          reputation = existing.reputation;
        };
      };
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?RacerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?RacerProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
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
    // Only admins can complete challenges to prevent cheating
    // In a real racing game, this would be the race official/system
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

    // Verify winner is one of the participants
    if (winner != challenge.challenger and winner != challenge.challenged) {
      Runtime.trap("Winner must be one of the challenge participants");
    };

    let loser = if (winner == challenge.challenger) {
      challenge.challenged;
    } else {
      challenge.challenger;
    };

    // Update profiles
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

    // Update challenge
    let updated = {
      challenge with
      winner = ?winner;
      status = #completed;
    };
    challenges.add(challengeId, updated);

    // Add to activity feed
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

    // Keep only latest 20 events
    while (activity.size() > 20) {
      let _ = activity.removeLast();
    };
  };

  // Public leaderboard - accessible to everyone including guests
  public query func getLeaderboard() : async [RacerProfile] {
    profiles.values().toArray().sort(RacerProfile.compareByReputation);
  };

  // Public activity feed - accessible to everyone including guests
  public query func getActivityFeed() : async [RaceEvent] {
    activity.toArray();
  };
};
