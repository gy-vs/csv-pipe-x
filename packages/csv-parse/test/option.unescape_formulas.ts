import "should";
// Import the source of csv-stringify directly: inside the monorepo, the
// `csv-stringify` package name resolves to the published `dist` build while
// the round trip must exercise the current code.
import { stringify } from "../../csv-stringify/lib/sync.js";
import { parse } from "../lib/index.js";
import { parse as parse_sync } from "../lib/sync.js";

describe("Option `unescape_formulas`", function () {
  it("default to `false`", function () {
    const parser = parse({});
    parser.options.unescape_formulas.should.be.false();
  });

  it("leave fields untouched by default", function (next) {
    parse("'=a,''+b,plain", (err, records) => {
      if (err) return next(err);
      records.should.eql([["'=a", "''+b", "plain"]]);
      next();
    });
  });

  it("remove exactly one leading quote from escaped formulas", function (next) {
    parse(
      "'=a,''+b,'''-c,'@d,'＝e,'\tf,plain",
      { unescape_formulas: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([
          ["=a", "'+b", "''-c", "@d", "＝e", "\tf", "plain"],
        ]);
        next();
      },
    );
  });

  it("leave other fields untouched", function (next) {
    parse(
      "'c,it's,','',=a,plain",
      { unescape_formulas: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([["'c", "it's", "'", "''", "=a", "plain"]]);
        next();
      },
    );
  });

  it("unescape before `cast` is called", function (next) {
    const values: unknown[] = [];
    parse(
      "'=1,2",
      {
        unescape_formulas: true,
        cast: (value) => {
          values.push(value);
          return value;
        },
      },
      (err, records) => {
        if (err) return next(err);
        // `cast` receives the unescaped values
        values.should.eql(["=1", "2"]);
        records.should.eql([["=1", "2"]]);
        next();
      },
    );
  });

  it("with `columns` as `true`, unescape the header and the values", function (next) {
    parse(
      "'=col,plain\n''=v,'=v2",
      { unescape_formulas: true, columns: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([{ "=col": "'=v", plain: "=v2" }]);
        next();
      },
    );
  });

  it("with `columns` as an array", function (next) {
    parse(
      "''=v,'=v2",
      { unescape_formulas: true, columns: ["a", "b"] },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([{ a: "'=v", b: "=v2" }]);
        next();
      },
    );
  });

  it("with `trim`", function (next) {
    parse(
      "  '=a  ,b",
      { unescape_formulas: true, trim: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([["=a", "b"]]);
        next();
      },
    );
  });

  describe("round trip with csv-stringify `escape_formulas`", function () {
    it("restore the original values", function () {
      const records = [
        ["=SUM(A1)", "'=already", "it's", "@user", "plain"],
        ["'", "", '="a,b"', 'he said "hi"', "＝sum"],
        ["''", "'''+", "-1", "+x", "\ty"],
      ];
      const data = stringify(records, { escape_formulas: true });
      parse_sync(data, { unescape_formulas: true }).should.eql(records);
    });

    it("restore values starting with `\\r`", function () {
      const records = [["\rx"], ["\ry"]];
      const data = stringify(records, { escape_formulas: true });
      // Pin the record delimiter so a raw `\r` is not confused with it
      parse_sync(data, {
        unescape_formulas: true,
        record_delimiter: "\n",
      }).should.eql(records);
    });

    it("with `header` and `columns`", function () {
      const records = [
        { "=col1": "'=v1", plain: "=v2" },
        { "=col1": "@v3", plain: "v4" },
      ];
      const data = stringify(records, { escape_formulas: true, header: true });
      parse_sync(data, {
        unescape_formulas: true,
        columns: true,
      }).should.eql(records);
    });
  });
});
