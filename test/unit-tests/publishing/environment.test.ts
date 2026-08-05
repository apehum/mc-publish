import { describe, test, expect } from "@jest/globals";
import Environment from "../../../src/publishing/environment";

describe("Environment.parse", () => {
    test("snake_case names used by the Modrinth API are recognized", () => {
        expect(Environment.parse("client_only")).toStrictEqual(Environment.ClientOnly);
        expect(Environment.parse("dedicated_server_only")).toStrictEqual(Environment.DedicatedServerOnly);
        expect(Environment.parse("server_only_client_optional")).toStrictEqual(Environment.ServerOnlyClientOptional);
        expect(Environment.parse("client_or_server_prefers_both")).toStrictEqual(Environment.ClientOrServerPrefersBoth);
    });

    test("separators and casing do not matter", () => {
        expect(Environment.parse("CLIENT_ONLY")).toStrictEqual(Environment.ClientOnly);
        expect(Environment.parse("client-only")).toStrictEqual(Environment.ClientOnly);
        expect(Environment.parse("ClientOnly")).toStrictEqual(Environment.ClientOnly);
        expect(Environment.parse("client only")).toStrictEqual(Environment.ClientOnly);
    });

    test("unknown names are not resolved", () => {
        expect(Environment.parse("client")).toBeUndefined();
        expect(Environment.parse("both")).toBeUndefined();
        expect(Environment.parse("")).toBeUndefined();
    });
});

describe("Environment.parseInput", () => {
    test("missing and blank values are treated as unspecified", () => {
        expect(Environment.parseInput(undefined)).toBeUndefined();
        expect(Environment.parseInput(null)).toBeUndefined();
        expect(Environment.parseInput("")).toBeUndefined();
        expect(Environment.parseInput("   ")).toBeUndefined();
    });

    test("valid values are parsed", () => {
        expect(Environment.parseInput(" server_only ")).toStrictEqual(Environment.ServerOnly);
    });

    test("invalid values throw", () => {
        expect(() => Environment.parseInput("server-side")).toThrow();
    });
});

describe("Environment.toString", () => {
    test("every value round-trips through its Modrinth name", () => {
        for (const environment of Environment.getValues()) {
            expect(Environment.parse(Environment.toString(environment))).toStrictEqual(environment);
        }
    });

    test("names match the ones the Modrinth API expects", () => {
        expect(Environment.toString(Environment.ClientAndServer)).toStrictEqual("client_and_server");
        expect(Environment.toString(Environment.SingleplayerOnly)).toStrictEqual("singleplayer_only");
        expect(Environment.toString(Environment.ClientOrServerPrefersBoth)).toStrictEqual("client_or_server_prefers_both");
        expect(Environment.toString(Environment.Unknown)).toStrictEqual("unknown");
    });
});

describe("Environment.toCurseForgeSides", () => {
    test("client-only environments are tagged as client", () => {
        expect(Environment.toCurseForgeSides(Environment.ClientOnly)).toStrictEqual({ client: true, server: false });
        expect(Environment.toCurseForgeSides(Environment.SingleplayerOnly)).toStrictEqual({ client: true, server: false });
    });

    test("only dedicated servers are tagged as server alone", () => {
        expect(Environment.toCurseForgeSides(Environment.DedicatedServerOnly)).toStrictEqual({ client: false, server: true });
    });

    test("environments that can run on either side are tagged as both", () => {
        expect(Environment.toCurseForgeSides(Environment.ServerOnly)).toStrictEqual({ client: true, server: true });
        expect(Environment.toCurseForgeSides(Environment.ServerOnlyClientOptional)).toStrictEqual({ client: true, server: true });
        expect(Environment.toCurseForgeSides(Environment.ClientOnlyServerOptional)).toStrictEqual({ client: true, server: true });
        expect(Environment.toCurseForgeSides(Environment.ClientAndServer)).toStrictEqual({ client: true, server: true });
        expect(Environment.toCurseForgeSides(Environment.ClientOrServer)).toStrictEqual({ client: true, server: true });
        expect(Environment.toCurseForgeSides(Environment.ClientOrServerPrefersBoth)).toStrictEqual({ client: true, server: true });
    });

    test("unknown is not tagged at all", () => {
        expect(Environment.toCurseForgeSides(Environment.Unknown)).toStrictEqual({ client: false, server: false });
    });
});
