import { describe, test, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../../../src/utils/curseforge", () => {
    const calls: unknown[][] = [];
    return {
        calls,
        convertToCurseForgeVersions: (...args: unknown[]) => {
            calls.push(args);
            return Promise.resolve([]);
        },
        getProjectFileNames: () => Promise.resolve([]),
        uploadFile: () => Promise.resolve(0),
    };
});

import CurseForgePublisher from "../../../../src/publishing/curseforge/curseforge-publisher";

const { calls } = jest.requireMock("../../../../src/utils/curseforge") as { calls: unknown[][] };

function publish(options: Record<string, unknown>): Promise<void> {
    const publisher = new CurseForgePublisher();
    return (publisher as any).publishMod("id", "token", "name", "1.0.0", "release", ["fabric"], ["1.21.1"], [], "", [], [], options);
}

function publishedEnvironments(): string[] {
    return calls[0][3] as string[];
}

describe("CurseForgePublisher.publishMod", () => {
    beforeEach(() => {
        calls.length = 0;
    });

    test("the environment is mapped onto CurseForge's client/server tags", async () => {
        await publish({ environment: "server_only_client_optional" });

        expect(publishedEnvironments()).toStrictEqual(["client", "server"]);
    });

    test("dedicated servers are tagged as server alone", async () => {
        await publish({ environment: "dedicated_server_only" });

        expect(publishedEnvironments()).toStrictEqual(["server"]);
    });

    test("publishing without an environment fails, CurseForge requires one", async () => {
        await expect(publish({})).rejects.toThrow(/requires at least one environment/);
        expect(calls).toHaveLength(0);
    });

    test("an environment that maps onto neither side fails", async () => {
        await expect(publish({ environment: "unknown" })).rejects.toThrow(/requires at least one environment/);
        await expect(publish({ environment: "client_and_server", client: "false", server: "false" })).rejects.toThrow(/requires at least one environment/);
    });

    test("explicit client/server values override the mapped ones", async () => {
        await publish({ environment: "client_only", server: "true" });
        expect(publishedEnvironments()).toStrictEqual(["client", "server"]);

        calls.length = 0;

        await publish({ environment: "client_and_server", client: "false" });
        expect(publishedEnvironments()).toStrictEqual(["server"]);
    });

    test("client/server values work without an environment", async () => {
        await publish({ server: "true" });

        expect(publishedEnvironments()).toStrictEqual(["server"]);
    });

    test("an unknown environment is rejected", async () => {
        await expect(publish({ environment: "server-side" })).rejects.toThrow();
    });
});
