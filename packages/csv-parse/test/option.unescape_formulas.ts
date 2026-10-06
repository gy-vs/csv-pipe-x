import "should";
import { parse } from "../lib/index.js";
import { parse as parseSync } from "../lib/sync.js";
import { stringify } from "../../csv-stringify/lib/sync.js";

describe("Option `unescape_formulas`", function () {
  it("defaults to leaving values untouched", function (next) {
    parse("'=a,''b,c", (err, records) => {
      if (err) return next(err);
      records.should.eql([["'=a", "''b", "c"]]);
      next();
    });
  });

  it("strips the prefix of fields escaped by csv-stringify", function (next) {
    parse(
      [
        "'=SUM(A1)",
        "''=already",
        "it's",
        "'@user",
        "plain",
        "''",
        "",
        '"a,b"',
        "'\uFF1Dx",
        "'''",
      ].join(","),
      { unescape_formulas: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([
          [
            "=SUM(A1)",
            "'=already",
            "it's",
            "@user",
            "plain",
            "'",
            "",
            "a,b",
            "\uFF1Dx",
            "''",
          ],
        ]);
        next();
      },
    );
  });

  it("leaves single quotes which are not part of the escape untouched", function (next) {
    parse("' ,'a,'", { unescape_formulas: true }, (err, records) => {
      if (err) return next(err);
      records.should.eql([["' ", "'a", "'"]]);
      next();
    });
  });

  it("runs before `cast`", function (next) {
    // Encoded values `'=1` and `''abc` decode to `=1` and `'abc`; `cast`
    // must receive the decoded values, not the prefixed ones.
    parse(
      "'=1,''abc",
      {
        unescape_formulas: true,
        cast: (value) => `[${value}]`,
      },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([["[=1]", "['abc]"]]);
        next();
      },
    );
  });

  it("works with the native `cast` conversion", function (next) {
    // Restored values are converted like any other field: `'=1` decodes to
    // `=1`, which is not a number and stays a string.
    parse(
      "'=1,2,'x,abc",
      { unescape_formulas: true, cast: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([["=1", 2, "'x", "abc"]]);
        next();
      },
    );
  });

  it("works with `columns`", function (next) {
    parse(
      "title,author\n'=SUM(A1),''=already",
      { columns: true, unescape_formulas: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([{ title: "=SUM(A1)", author: "'=already" }]);
        next();
      },
    );
  });

  it("works with `trim`", function (next) {
    parse(
      " '=a , ''b \n '=c , plain ",
      { unescape_formulas: true, trim: true },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([
          ["=a", "'b"],
          ["=c", "plain"],
        ]);
        next();
      },
    );
  });

  it("works with `cast`, `columns` and `trim` together", function (next) {
    parse(
      " title , author \n '=SUM(A1) , ''=already \n plain , @me ",
      {
        unescape_formulas: true,
        columns: true,
        trim: true,
        cast: (value) => value.toUpperCase(),
      },
      (err, records) => {
        if (err) return next(err);
        records.should.eql([
          { TITLE: "=SUM(A1)", AUTHOR: "'=ALREADY" },
          { TITLE: "PLAIN", AUTHOR: "@ME" },
        ]);
        next();
      },
    );
  });

  it("round-trips a dataset through csv-stringify", function () {
    const input: string[][] = [
      ["=SUM(A1)", "'=already", "it's", "@user", "plain"],
      ["'", "", '"quoted,value', "\uFF1Dx", "carriage-\r-return"],
      ["\tstart", "-minus", "+plus", "\uFF20wide", "line\nbreak"],
      ["''", "'x", "  spaces", "a'b", ""],
    ];
    const output = stringify(input, { escape_formulas: true });
    parseSync(output, {
      unescape_formulas: true,
      record_delimiter: "\n",
    }).should.eql(input);
  });

  it("round-trips object records with `columns` and a header", function () {
    const input = [
      { title: '=HYPERLINK("http://evil.example")', author: "'=already" },
      { title: "plain", author: "a'b" },
    ];
    const output = stringify(input, {
      escape_formulas: true,
      header: true,
      columns: ["title", "author"],
    });
    parseSync(output, {
      unescape_formulas: true,
      columns: true,
      record_delimiter: "\n",
    }).should.eql(input);
  });
});
