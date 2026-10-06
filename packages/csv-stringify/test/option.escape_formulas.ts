import "should";
import dedent from "dedent";
// Import the source of csv-parse directly: inside the monorepo, the
// `csv-parse` package name resolves to the published `dist` build while the
// round trip must exercise the current code.
import { parse } from "../../csv-parse/lib/sync.js";
import { stringify } from "../lib/index.js";

describe("Option `escape_formulas`", function () {
  it("default to `false`", function (next) {
    const stringifier = stringify([["abc", "def"]], () => {
      stringifier.options.escape_formulas.should.be.false();
      next();
    });
  });

  it("escape =, +, -, @, \\t, \\r and unicode equivalent signs", function (next) {
    stringify(
      [
        ["=a", 1],
        ["+b", 2],
        ["-c", 3],
        ["@d", 4],
        ["\te", 5],
        ["\rf", 6],
        ["g", 7],
        ["\uFF1Dh", 8],
        ["\uFF0Bi", 9],
        ["\uFF0Dj", 10],
        ["\uFF20k", 11],
        ["\uFF0Cl", 12], // \uFF0C is 'full width comma' and should not be escaped
      ],
      {
        escape_formulas: true,
        eof: false,
      },
      (err, data) => {
        if (err) return next(err);
        data.should.eql(
          [
            "'=a,1",
            "'+b,2",
            "'-c,3",
            "'@d,4",
            "'\te,5",
            "'\rf,6",
            "g,7",
            "'\uFF1Dh,8",
            "'\uFF0Bi,9",
            "'\uFF0Dj,10",
            "'\uFF20k,11",
            "\uFF0Cl,12",
          ].join("\n"),
        );
        next();
      },
    );
  });

  it("with `quoted` option", function (next) {
    stringify(
      [
        ["=a", 1],
        ["b", 2],
      ],
      {
        escape_formulas: true,
        quoted: true,
        eof: false,
      },
      (err, data) => {
        if (err) return next(err);
        data.should.eql(dedent`
          "'=a","1"
          "b","2"
        `);
        next();
      },
    );
  });

  it("escape values which already look escaped", function (next) {
    stringify(
      [
        ["'=a", 1],
        ["''=b", 2],
        ["'", 3],
        ["''", 4],
        ["'c", 5],
        ["it's", 6],
      ],
      {
        escape_formulas: true,
        eof: false,
      },
      (err, data) => {
        if (err) return next(err);
        data.should.eql(
          ["''=a,1", "'''=b,2", "',3", "'',4", "'c,5", "it's,6"].join("\n"),
        );
        next();
      },
    );
  });

  describe("round trip with csv-parse `unescape_formulas`", function () {
    it("restore the original values", function (next) {
      const records = [
        ["=SUM(A1)", "'=already", "it's", "@user", "plain"],
        ["'", "", '="a,b"', 'he said "hi"', "＝sum"],
        ["''", "'''+", "-1", "+x", "\ty"],
      ];
      stringify(records, { escape_formulas: true }, (err, data) => {
        if (err) return next(err);
        parse(data, { unescape_formulas: true }).should.eql(records);
        next();
      });
    });

    it("with `header` and `columns`", function (next) {
      const records = [
        { "=col1": "'=v1", plain: "=v2" },
        { "=col1": "@v3", plain: "v4" },
      ];
      stringify(
        records,
        { escape_formulas: true, header: true },
        (err, data) => {
          if (err) return next(err);
          parse(data, { unescape_formulas: true, columns: true }).should.eql(
            records,
          );
          next();
        },
      );
    });
  });
});
