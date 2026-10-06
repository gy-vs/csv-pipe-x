import "should";
import dedent from "dedent";
import { stringify } from "../lib/index.js";
import { parse } from "../../csv-parse/lib/sync.js";

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

  it("prefixes a single quote to fields already starting with a quote", function (next) {
    stringify(
      [
        ["=SUM(A1)", "'=already"],
        ["'single-quote", "'"],
        ["''two-quotes", "plain"],
      ],
      {
        escape_formulas: true,
        eof: false,
      },
      (err, data) => {
        if (err) return next(err);
        data.should.eql(
          [
            "'=SUM(A1),''=already",
            "''single-quote,''",
            "'''two-quotes,plain",
          ].join("\n"),
        );
        next();
      },
    );
  });

  it("round-trips arbitrary string values", function (next) {
    const input = [
      ["=SUM(A1)", "'=already", "it's", "@user", "plain"],
      ["'", "", '"quoted,value', "＝x", "carriage-\r-return"],
      ["\tstart", "-minus", "+plus", "＠wide", "line\nbreak"],
    ];
    stringify(input, { escape_formulas: true, eof: false }, (err, data) => {
      if (err) return next(err);
      parse(data, {
        unescape_formulas: true,
        record_delimiter: "\n",
      }).should.eql(input);
      next();
    });
  });

  it("does not escape when disabled", function (next) {
    stringify(
      [["=a", "'b", "c"]],
      { escape_formulas: false, eof: false },
      (err, data) => {
        if (err) return next(err);
        data.should.eql("=a,'b,c");
        next();
      },
    );
  });
});
