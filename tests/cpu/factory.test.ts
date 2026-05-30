import { describe, expect, it } from "vitest";
import { createStrategy, GreedyStrategy, NegamaxStrategy, RandomStrategy } from "@/cpu";

describe("createStrategy", () => {
  it("returns RandomStrategy for 'easy'", () => {
    expect(createStrategy("easy")).toBeInstanceOf(RandomStrategy);
  });
  it("returns GreedyStrategy for 'normal'", () => {
    expect(createStrategy("normal")).toBeInstanceOf(GreedyStrategy);
  });
  it("returns NegamaxStrategy for 'hard'", () => {
    expect(createStrategy("hard")).toBeInstanceOf(NegamaxStrategy);
  });
});
