import "should";
import { parse } from "../lib/index.js";

describe("Option `unescape_formulas`", function () {
  it("validation", function () {
    (() => {
      parse("", { unescape_formulas: "invalid" }, () => {});
    }).should.throw(
      'Invalid Option: unescape_formulas must be a boolean, got "invalid"',
    );
    (() => {
      parse("", { unescape_formulas: 1 }, () => {});
    }).should.throw(
      "Invalid Option: unescape_formulas must be a boolean, got 1",
    );
  });

  it("accepts the camelcase `unescapeFormulas` spelling", function () {
    parse("'=a,'b", { unescapeFormulas: true }, (err, records) => {
      if (err) throw err;
      records.should.eql([["=a", "'b"]]);
    });
  });
});
