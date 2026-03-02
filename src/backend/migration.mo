import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  type OldRacerProfile = {
    name : Text;
    bio : Text;
    avatarUrl : ?Text;
    wins : Nat;
    losses : Nat;
    reputation : Int;
  };

  type OldCar = {
    make : Text;
    model : Text;
    year : Nat;
    mods : [Text];
  };

  type OldRaceChallenge = {
    id : Nat;
    challenger : Principal.Principal;
    challenged : Principal.Principal;
    winner : ?Principal.Principal;
    status : ChallengeStatus;
    timestamp : Int;
  };

  type ChallengeStatus = {
    #pending;
    #accepted;
    #declined;
    #completed;
  };

  type OldRaceEvent = {
    challenger : Text;
    challenged : Text;
    winner : Text;
    timestamp : Int;
  };

  type ChatMessage = {
    id : Nat;
    roomId : Text;
    senderName : Text;
    senderId : Text;
    text : Text;
    timestamp : Int;
  };

  type ChatRoom = {
    id : Text;
    name : Text;
    isCustom : Bool;
    createdBy : Text;
  };

  type OldActor = {
    nextChallengeId : Nat;
    nextMessageId : Nat;
    profiles : Map.Map<Principal.Principal, OldRacerProfile>;
    cars : Map.Map<Principal.Principal, OldCar>;
    challenges : Map.Map<Nat, OldRaceChallenge>;
    activity : List.List<OldRaceEvent>;
    chatRooms : Map.Map<Text, ChatRoom>;
    chatMessages : Map.Map<Text, List.List<ChatMessage>>;
    sampleRacers : Set.Set<Principal.Principal>;
  };

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

  type TaskProgress = {
    currentTaskId : Nat;
    completionsOnCurrentTask : Nat;
  };

  type NewActor = {
    nextChallengeId : Nat;
    nextMessageId : Nat;
    profiles : Map.Map<Principal.Principal, RacerProfile>;
    cars : Map.Map<Principal.Principal, OldCar>;
    challenges : Map.Map<Nat, OldRaceChallenge>;
    activity : List.List<OldRaceEvent>;
    chatRooms : Map.Map<Text, ChatRoom>;
    chatMessages : Map.Map<Text, List.List<ChatMessage>>;
    sampleRacers : Set.Set<Principal.Principal>;
    taskProgress : Map.Map<Principal.Principal, TaskProgress>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.profiles.map<Principal.Principal, OldRacerProfile, RacerProfile>(
      func(_principal, oldProfile) {
        {
          oldProfile with
          xp = 0 : Nat;
          speed = 0 : Nat;
        };
      }
    );

    let emptyTaskProgress = Map.empty<Principal.Principal, TaskProgress>();

    {
      old with
      profiles = newProfiles;
      taskProgress = emptyTaskProgress;
    };
  };
};
