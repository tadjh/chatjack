import { Vote } from "@/lib/integrations/vote";
import { COMMAND } from "@/lib/types";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Vote", () => {
  let vote: Vote;
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vote = new Vote();
    callback = vi.fn();
  });

  describe("register", () => {
    it("should register a new vote", () => {
      vote.register("user1", COMMAND.HIT, callback);
      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT);
    });

    it("should call the callback with the command and count when registering a new vote", () => {
      vote.register("user1", COMMAND.HIT, callback);
      expect(callback).toHaveBeenCalledWith(COMMAND.HIT, 1);
    });

    it("should change an existing vote", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user1", COMMAND.STAND, callback);

      expect(vote.tally(COMMAND.HIT)).toBe(COMMAND.STAND);
      expect(callback).toHaveBeenCalledTimes(3); // Initial increment + decrement + increment
      expect(callback).toHaveBeenNthCalledWith(2, COMMAND.HIT, 0); // Decrement HIT
      expect(callback).toHaveBeenNthCalledWith(3, COMMAND.STAND, 1); // Increment STAND
    });

    it("should not change counts when registering the same vote twice", () => {
      vote.register("user1", COMMAND.HIT, callback);
      const vote1 = vote.getCount(COMMAND.HIT);
      vi.clearAllMocks();

      vote.register("user1", COMMAND.HIT, callback);
      const vote2 = vote.getCount(COMMAND.HIT);
      expect(vote1).toBe(vote2);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT);
    });

    it("should handle multiple users voting", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.HIT, callback);
      vote.register("user3", COMMAND.STAND, callback);

      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT); // HIT has 2 votes vs 1 for STAND
    });

    it("should update the callback for subsequent votes", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      vote.register("user1", COMMAND.HIT, callback1);
      vote.register("user2", COMMAND.STAND, callback2);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Change user1's vote - should use callback2
      vote.register("user1", COMMAND.STAND, callback2);

      expect(callback1).toHaveBeenCalledTimes(1); // No additional calls
      expect(callback2).toHaveBeenCalledTimes(3); // Two more calls (decrement + increment)
    });
  });

  describe("tally", () => {
    it("should return the command with the most votes", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.HIT, callback);
      vote.register("user3", COMMAND.STAND, callback);

      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT);
    });

    it("should return the default command when there's a tie", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.STAND, callback);

      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.STAND);
    });

    it("should return the default command when there are no votes", () => {
      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.STAND);
    });

    it("should handle a tie with more than two options", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.STAND, callback);
      vote.register("user3", COMMAND.START, callback);

      // All commands have 1 vote, so default should win
      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.STAND);
    });
  });

  describe("reset", () => {
    it("should clear all votes", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.STAND, callback);

      vote.reset();

      expect(vote.tally(COMMAND.HIT)).toBe(COMMAND.HIT);
    });

    it("should allow registering votes after reset", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.reset();
      vote.register("user1", COMMAND.STAND, callback);

      expect(vote.tally(COMMAND.HIT)).toBe(COMMAND.STAND);
    });

    it("should clear the callback", () => {
      vote.register("user1", COMMAND.HIT, callback);
      vote.reset();

      // Create a test method to access private methods for testing
      const testIncrement = (vote: Vote, command: COMMAND): void => {
        // Using Function constructor to access private method
        // This is only for testing purposes
        const voteObj = vote as unknown as {
          increment(command: COMMAND): Vote;
        };
        voteObj.increment(command);
      };

      testIncrement(vote, COMMAND.STAND);

      expect(callback).toHaveBeenCalledTimes(1); // Only the initial call, not after reset
    });
  });

  describe("edge cases", () => {
    it("should handle multiple command types", () => {
      // Test with all available command types
      vote.register("user1", COMMAND.HIT, callback);
      vote.register("user2", COMMAND.STAND, callback);
      vote.register("user3", COMMAND.START, callback);
      vote.register("user4", COMMAND.RESTART, callback);
      vote.register("user5", COMMAND.STOP, callback);

      // Register more votes for HIT to make it win
      vote.register("user6", COMMAND.HIT, callback);
      vote.register("user7", COMMAND.HIT, callback);

      expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT);
    });
  });

  describe("private method behaviors", () => {
    describe("increment and decrement", () => {
      it("should increment and decrement vote counts correctly", () => {
        // First vote increments
        vote.register("user1", COMMAND.HIT, callback);
        expect(callback).toHaveBeenLastCalledWith(COMMAND.HIT, 1);
        const vote1 = vote.getCount(COMMAND.HIT);

        // Second vote for same command should not change count
        vote.register("user1", COMMAND.HIT, callback);
        const vote2 = vote.getCount(COMMAND.HIT);
        expect(vote1).toBe(vote2);
        expect(callback).toHaveBeenCalledTimes(2);

        // Changing vote should decrement old and increment new
        vote.register("user1", COMMAND.STAND, callback);
        const vote3 = vote.getCount(COMMAND.STAND);
        expect(vote1).toBe(vote3);
        expect(callback).toHaveBeenNthCalledWith(2, COMMAND.HIT, 1);
        expect(callback).toHaveBeenNthCalledWith(3, COMMAND.HIT, 0);
      });

      it("should handle multiple increments and decrements", () => {
        vote.register("user1", COMMAND.HIT, callback);
        vote.register("user2", COMMAND.HIT, callback);
        expect(callback).toHaveBeenLastCalledWith(COMMAND.HIT, 2);

        vote.register("user1", COMMAND.STAND, callback);
        expect(callback).toHaveBeenNthCalledWith(3, COMMAND.HIT, 1);
        expect(callback).toHaveBeenNthCalledWith(4, COMMAND.STAND, 1);
      });
    });

    describe("noChange", () => {
      it("should call callback with current count when vote doesn't change", () => {
        vote.register("user1", COMMAND.HIT, callback);
        vi.clearAllMocks();

        vote.register("user1", COMMAND.HIT, callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(COMMAND.HIT, 1);
      });
    });

    describe("change", () => {
      it("should handle vote changes correctly", () => {
        // Initial vote
        vote.register("user1", COMMAND.HIT, callback);
        vi.clearAllMocks();

        // Change vote
        vote.register("user1", COMMAND.STAND, callback);

        // Should decrement old vote and increment new vote
        expect(callback).toHaveBeenNthCalledWith(1, COMMAND.HIT, 0);
        expect(callback).toHaveBeenNthCalledWith(2, COMMAND.STAND, 1);
        expect(vote.tally(COMMAND.HIT)).toBe(COMMAND.STAND);
      });

      it("should maintain correct counts when multiple users change votes", () => {
        vote.register("user1", COMMAND.HIT, callback);
        vote.register("user2", COMMAND.HIT, callback);
        vote.register("user3", COMMAND.STAND, callback);
        vi.clearAllMocks();

        vote.register("user1", COMMAND.STAND, callback);
        expect(callback).toHaveBeenNthCalledWith(1, COMMAND.HIT, 1);
        expect(callback).toHaveBeenNthCalledWith(2, COMMAND.STAND, 2);
        expect(vote.tally(COMMAND.HIT)).toBe(COMMAND.STAND);
      });
    });

    describe("dedupe and record", () => {
      it("should handle duplicate votes correctly", () => {
        vote.register("user1", COMMAND.HIT, callback);
        vi.clearAllMocks();

        // Same vote should trigger noChange
        vote.register("user1", COMMAND.HIT, callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(COMMAND.HIT, 1);
      });

      it("should record new votes correctly", () => {
        vote.register("user1", COMMAND.HIT, callback);
        expect(callback).toHaveBeenCalledWith(COMMAND.HIT, 1);
        expect(vote.tally(COMMAND.STAND)).toBe(COMMAND.HIT);
      });

      it("should throw error when deduping without previous vote", () => {
        // Reset to ensure no previous votes
        vote.reset();

        // Try to change non-existent vote
        expect(() => {
          const testVote = vote as unknown as {
            dedupe(username: string, command: COMMAND): Vote;
          };
          testVote.dedupe("user1", COMMAND.HIT);
        }).toThrow("No previous vote found");
      });
    });
  });
});

