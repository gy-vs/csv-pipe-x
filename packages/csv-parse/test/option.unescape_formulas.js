import "should";
import { parse } from "../lib/index.js";

describe("Option `unescape_formulas`", function () {
  it("validation", function () {
    (() => {
      parse("", { unescape_formulas: 1 }, () => {});
    }).should.throw({
      code: "CSV_INVALID_OPTION_UNESCAPE_FORMULAS",
      message:
        "Invalid option unescape_formulas: unescape_formulas must be a boolean, got 1",
    });
    (() => {
      parse("", { unescape_formulas: "true" }, () => {});
    }).should.throw({
      code: "CSV_INVALID_OPTION_UNESCAPE_FORMULAS",
      message:
        'Invalid option unescape_formulas: unescape_formulas must be a boolean, got "true"',
    });
  });
});
