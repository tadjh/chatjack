import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Twitch } from "../twitch";
import { EventBus } from "../../event-bus";
import { Vote } from "../vote";
import { Debug } from "../../debug";
import { COMMAND, EVENT } from "../../types";
import * as tmi from "tmi.js";
import type { MediatorEvent } from "../../event-bus";

// Mock tmi.js Client
vi.mock("tmi.js", () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  };
});

// Mock Vote class
vi.mock("../vote", () => {
  return {
    Vote: vi.fn().mockImplementation(() => ({
      reset: vi.fn(),
      register: vi.fn(),
      tally: vi.fn(),
    })),
  };
});

// Mock EventBus
vi.mock("../../event-bus", () => {
  const mockEventBus = {
    emit: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
  return {
    EventBus: {
      create: vi.fn(() => mockEventBus),
    },
  };
});

describe("Twitch", () => {
  let eventBus: EventBus;
  let vote: Vote;
  let debug: Debug;

  beforeEach(() => {
    // Reset mocks and instances before each test
    vi.clearAllMocks();
    Twitch.destroy();
    eventBus = EventBus.create();
    vote = new Vote();
    debug = new Debug("Twitch", "Purple");
  });

  afterEach(() => {
    Twitch.destroy();
  });

  describe("Instance Management", () => {
    it("should create a singleton instance", () => {
      const instance1 = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      const instance2 = Twitch.create(
        { channel: "test2", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      expect(instance1).toBe(instance2);
    });

    it("should properly destroy the instance", () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      Twitch.destroy();
      const newInstance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      expect(instance).not.toBe(newInstance);
    });
  });

  describe("Setup and Connection", () => {
    it("should not setup with empty channel", async () => {
      const instance = Twitch.create(
        { channel: "", broadcaster_id: "" },
        eventBus,
        vote,
        debug,
      );
      await instance.setup("");

      expect(tmi.Client).not.toHaveBeenCalled();
    });

    it("should setup with valid channel", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      await instance.setup("testChannel");

      expect(tmi.Client).toHaveBeenCalledWith({
        options: { debug: false },
        channels: ["testChannel"],
      });
    });
  });

  describe("Message Parsing", () => {
    it("should correctly parse valid commands", () => {
      expect(Twitch.parseMessage("!hit")).toBe(COMMAND.HIT);
      expect(Twitch.parseMessage("!stand")).toBe(COMMAND.STAND);
      expect(Twitch.parseMessage("!start")).toBe(COMMAND.START);
      expect(Twitch.parseMessage("!restart")).toBe(COMMAND.RESTART);
      expect(Twitch.parseMessage("!stop")).toBe(COMMAND.STOP);
    });

    it("should ignore case in commands", () => {
      expect(Twitch.parseMessage("!Hit")).toBe(COMMAND.HIT);
      expect(Twitch.parseMessage("!STAND")).toBe(COMMAND.STAND);
      expect(Twitch.parseMessage("!Start")).toBe(COMMAND.START);
      expect(Twitch.parseMessage("!RESTART")).toBe(COMMAND.RESTART);
      expect(Twitch.parseMessage("!Stop")).toBe(COMMAND.STOP);
    });

    it("should ignore everything expect the first word (command)", () => {
      expect(Twitch.parseMessage("!hit some extra text")).toBe(COMMAND.HIT);
      expect(Twitch.parseMessage("!stand 123")).toBe(COMMAND.STAND);
      expect(Twitch.parseMessage("!start 123 abc")).toBe(COMMAND.START);
      expect(Twitch.parseMessage("!restart 123 abc")).toBe(COMMAND.RESTART);
      expect(Twitch.parseMessage("!stop 123 abc")).toBe(COMMAND.STOP);
    });

    it("should ignore invisible characters", () => {
      expect(Twitch.parseMessage("!hit\u200B")).toBe(COMMAND.HIT);
      expect(Twitch.parseMessage("!stand\u200B")).toBe(COMMAND.STAND);
      expect(Twitch.parseMessage("!start\u200B")).toBe(COMMAND.START);
      expect(Twitch.parseMessage("!restart\u200B")).toBe(COMMAND.RESTART);
      expect(Twitch.parseMessage("!stop\u200B")).toBe(COMMAND.STOP);
    });

    it("should ignore leading and trailing spaces", () => {
      expect(Twitch.parseMessage("   !hit   ")).toBe(COMMAND.HIT);
      expect(Twitch.parseMessage("   !stand   ")).toBe(COMMAND.STAND);
      expect(Twitch.parseMessage("   !start   ")).toBe(COMMAND.START);
      expect(Twitch.parseMessage("   !restart   ")).toBe(COMMAND.RESTART);
      expect(Twitch.parseMessage("   !stop   ")).toBe(COMMAND.STOP);
    });

    it("should return null for invalid commands", () => {
      expect(Twitch.parseMessage("invalid")).toBeNull();
      expect(Twitch.parseMessage("!invalid")).toBeNull();
      expect(Twitch.parseMessage("")).toBeNull();
    });
  });

  describe("Vote Handling", () => {
    it("should handle vote updates", () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      const mockRegister = vi.mocked(vote.register);

      // Mock the register function to call the callback
      mockRegister.mockImplementation((username, command, callback) => {
        callback(command, 1);
        return vote;
      });

      instance.handleVoteUpdate("user1", COMMAND.HIT);

      // Verify vote registration
      expect(vote.register).toHaveBeenCalledWith(
        "user1",
        COMMAND.HIT,
        expect.any(Function),
      );

      // Verify event emission with exact data
      expect(eventBus.emit).toHaveBeenCalledWith("chat", {
        type: EVENT.VOTE_UPDATE,
        data: { command: COMMAND.HIT, count: 1 },
      });
    });

    it("should handle player actions", () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      const emitSpy = vi.spyOn(eventBus, "emit");

      instance.handlePlayerAction(COMMAND.HIT);

      expect(emitSpy).toHaveBeenCalledWith("chat", {
        type: EVENT.VOTE_END,
        data: { command: COMMAND.HIT },
      });
    });
  });

  describe("Event Bus Integration", () => {
    it("should emit connected event when client connects", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      await instance.setup("testChannel");

      // Simulate connected callback
      const connectCallback = vi
        .mocked(tmi.Client)
        .mock.results[0].value.addListener.mock.calls.find(
          (call: [string, unknown]) => call[0] === "connected",
        )?.[1] as () => void;
      connectCallback();

      expect(eventBus.emit).toHaveBeenCalledWith("chat", {
        type: EVENT.CONNECTED,
      });
    });

    it("should emit disconnected event when client disconnects", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      await instance.setup("testChannel");

      // Simulate disconnected callback
      const disconnectCallback = vi
        .mocked(tmi.Client)
        .mock.results[0].value.addListener.mock.calls.find(
          (call: [string, unknown]) => call[0] === "disconnected",
        )?.[1] as () => void;
      disconnectCallback();

      expect(eventBus.emit).toHaveBeenCalledWith("chat", {
        type: EVENT.DISCONNECTED,
      });
    });

    it("should subscribe to mediator events during setup", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      await instance.setup("testChannel");

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        "mediator",
        expect.any(Function),
        "Twitch",
      );
    });

    it("should unsubscribe from mediator events during teardown", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      await instance.setup("testChannel");

      await instance.teardown();

      expect(eventBus.unsubscribe).toHaveBeenCalledWith(
        "mediator",
        expect.any(Function),
      );
    });
  });

  describe("Vote Timer and Message Handling", () => {
    it("should handle vote start event and setup vote timer", async () => {
      vi.useFakeTimers();

      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      await instance.setup("test");

      const mockClient = vi.mocked(tmi.Client).mock.results[0].value;
      mockClient.addListener.mockClear();

      // Get the mediator callback that was registered during setup
      const mediatorCallback = vi
        .mocked(eventBus.subscribe)
        .mock.calls.find((call) => call[0] === "mediator")?.[1] as (
        event: MediatorEvent,
      ) => void;

      const voteStartEvent: MediatorEvent = {
        type: EVENT.VOTE_START,
        data: {
          options: [COMMAND.HIT, COMMAND.STAND],
          startTime: Date.now(),
          duration: 10,
        },
      };

      // Call the mediator callback directly
      mediatorCallback(voteStartEvent);

      // Advance timers to trigger the vote timer setup
      vi.advanceTimersByTime(1000);

      expect(vote.reset).toHaveBeenCalled();
      expect(mockClient.addListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );

      // Advance timers to end of vote duration
      vi.advanceTimersByTime(10000);

      expect(vote.tally).toHaveBeenCalledWith(COMMAND.STAND);

      vi.useRealTimers();
    });

    it("should handle wait for start event", async () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      // Setup the client first
      await instance.setup("test");

      const mockClient = vi.mocked(tmi.Client).mock.results[0].value;
      // Clear previous calls to addListener during setup
      mockClient.addListener.mockClear();

      // Get the mediator callback that was registered during setup
      const mediatorCallback = vi
        .mocked(eventBus.subscribe)
        .mock.calls.find((call) => call[0] === "mediator")?.[1] as (
        event: MediatorEvent,
      ) => void;

      const waitStartEvent: MediatorEvent = {
        type: EVENT.WAIT_FOR_START,
        data: {
          options: [COMMAND.START, COMMAND.RESTART],
        },
      };

      // Call the mediator callback directly
      mediatorCallback(waitStartEvent);

      expect(mockClient.addListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    });

    it("should process vote updates", () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      instance.handleVoteUpdate("testUser", COMMAND.HIT);

      expect(vote.register).toHaveBeenCalledWith(
        "testUser",
        COMMAND.HIT,
        expect.any(Function),
      );
    });

    it("should handle player actions and clear vote timer", () => {
      const instance = Twitch.create(
        { channel: "test", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );

      // Setup vote timer
      const voteStartEvent: MediatorEvent = {
        type: EVENT.VOTE_START,
        data: {
          options: [COMMAND.HIT, COMMAND.STAND],
          startTime: Date.now(),
          duration: 10,
        },
      };
      eventBus.emit("mediator", voteStartEvent);

      // Trigger player action
      instance.handlePlayerAction(COMMAND.HIT);

      expect(eventBus.emit).toHaveBeenCalledWith("chat", {
        type: EVENT.VOTE_END,
        data: { command: COMMAND.HIT },
      });
    });
  });

  describe("Channel and Options", () => {
    it("should return correct channel value", () => {
      const instance = Twitch.create(
        { channel: "testChannel", broadcaster_id: "123" },
        eventBus,
        vote,
        debug,
      );
      expect(instance.channel).toBe("testChannel");
    });

    it("should use default options when none provided", () => {
      const instance = Twitch.create(undefined, eventBus, vote, debug);
      expect(instance.channel).toBe("");
    });
  });
});
