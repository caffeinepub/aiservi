import Blob "mo:core/Blob";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Option "mo:core/Option";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Outcall "http-outcalls/outcall";

actor {
  type SceneStatus = {
    #pending;
    #generating;
    #done;
    #error;
  };

  type Scene = {
    id : Text;
    projectId : Text;
    prompt : Text;
    order : Nat;
    status : SceneStatus;
    videoUrl : ?Text;
    replicateJobId : ?Text;
  };

  type Project = {
    id : Text;
    name : Text;
    createdAt : Int;
  };

  type ReplicateApiKey = Text;
  type UserProfile = {
    name : Text;
  };

  let projectStore = Map.empty<Text, Project>();
  let scenes = Map.empty<Text, Scene>();
  let replicateApiKeyStore = Map.empty<Principal, ReplicateApiKey>();
  let accessControlState = AccessControl.initState();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Escape a string for safe embedding inside a JSON string literal
  func jsonEscape(s : Text) : Text {
    var result = "";
    for (c in s.chars()) {
      if (c == '\"') { result #= "\\\"" }
      else if (c == '\\') { result #= "\\\\" }
      else if (c == '\n') { result #= "\\n" }
      else if (c == '\r') { result #= "\\r" }
      else if (c == '\t') { result #= "\\t" }
      else { result #= Text.fromChar(c) };
    };
    result;
  };

  func getProjectInternal(projectId : Text) : Project {
    switch (projectStore.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) { project };
    };
  };

  func getSceneInternal(sceneId : Text) : Scene {
    switch (scenes.get(sceneId)) {
      case (null) { Runtime.trap("Scene not found") };
      case (?scene) { scene };
    };
  };

  module Scene {
    public func compare(scene1 : Scene, scene2 : Scene) : Order.Order {
      Nat.compare(scene1.order, scene2.order);
    };
  };

  func arrayToProjectOutput(projects : [Project]) : [Project] {
    projects.map(func(p) { p });
  };

  func arrayToSceneOutput(scenes : [Scene]) : [Scene] {
    scenes.map(func(s) { s });
  };

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  public shared func createReplicatePrediction(apiKey : Text, prompt : Text) : async Text {
    let safePrompt = jsonEscape(prompt);
    let body = "{\"input\":{\"prompt\":\"" # safePrompt # "\"}}";
    let headers : [Outcall.Header] = [
      { name = "Authorization"; value = "Bearer " # apiKey },
      { name = "Content-Type"; value = "application/json" },
    ];
    await Outcall.httpPostRequest(
      "https://api.replicate.com/v1/models/minimax/video-01/predictions",
      headers,
      body,
      transform,
    );
  };

  public shared func pollReplicatePrediction(apiKey : Text, predictionId : Text) : async Text {
    let headers : [Outcall.Header] = [
      { name = "Authorization"; value = "Bearer " # apiKey },
    ];
    await Outcall.httpGetRequest(
      "https://api.replicate.com/v1/predictions/" # predictionId,
      headers,
      transform,
    );
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createProject(name : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };
    let id = "placeholder-id";
    let project : Project = {
      id;
      name;
      createdAt = Time.now();
    };
    projectStore.add(id, project);
    project;
  };

  public query ({ caller }) func getProject(projectId : Text) : async Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    getProjectInternal(projectId);
  };

  public query ({ caller }) func getAllProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    arrayToProjectOutput(projectStore.values().toArray());
  };

  public shared ({ caller }) func deleteProject(projectId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };
    if (not projectStore.containsKey(projectId)) {
      Runtime.trap("Project not found");
    };
    projectStore.remove(projectId);
    for (sid in scenes.keys().filter(func(sid) { getSceneInternal(sid).projectId == projectId })) {
      scenes.remove(sid);
    };
  };

  public shared ({ caller }) func addScene(projectId : Text, prompt : Text) : async Scene {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add scenes");
    };
    let id = "placeholder-id";
    let project = getProjectInternal(projectId);
    let newScene : Scene = {
      id;
      projectId = project.id;
      prompt;
      order = scenes.values().toArray().filter(func(scene) { scene.projectId == projectId }).size();
      status = #pending;
      videoUrl = null;
      replicateJobId = null;
    };
    scenes.add(id, newScene);
    newScene;
  };

  public shared ({ caller }) func deleteScene(sceneId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete scenes");
    };
    if (not scenes.containsKey(sceneId)) {
      Runtime.trap("Scene not found");
    };
    scenes.remove(sceneId);
  };

  public query ({ caller }) func getScenesForProject(projectId : Text) : async [Scene] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view scenes");
    };
    scenes.values().toArray().filter(func(scene) { scene.projectId == projectId }).sort().map(func(s) { s });
  };

  func swapOrders(s1 : Text, s2 : Text) {
    let scene1 = getSceneInternal(s1);
    let scene2 = getSceneInternal(s2);
    let updatedScene1 : Scene = {
      id = scene1.id;
      projectId = scene1.projectId;
      prompt = scene1.prompt;
      order = scene2.order;
      status = scene1.status;
      videoUrl = scene1.videoUrl;
      replicateJobId = scene1.replicateJobId;
    };
    let updatedScene2 : Scene = {
      id = scene2.id;
      projectId = scene2.projectId;
      prompt = scene2.prompt;
      order = scene1.order;
      status = scene2.status;
      videoUrl = scene2.videoUrl;
      replicateJobId = scene2.replicateJobId;
    };
    scenes.add(s1, updatedScene1);
    scenes.add(s2, updatedScene2);
  };

  public shared ({ caller }) func reorderScenes(sceneId1 : Text, sceneId2 : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reorder scenes");
    };
    swapOrders(sceneId1, sceneId2);
  };

  public shared ({ caller }) func storeReplicateApiKey(key : ReplicateApiKey) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can store API key");
    };
    replicateApiKeyStore.add(caller, key);
  };

  public shared ({ caller }) func getReplicateApiKey(user : Principal) : async ?ReplicateApiKey {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can retrieve API key");
    };
    replicateApiKeyStore.get(user);
  };
};
