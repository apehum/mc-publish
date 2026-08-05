import { describe, test, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../../../../src/utils/modrinth", () => {
    const calls: unknown[][] = [];
    return {
        calls,
        createVersion: (...args: unknown[]) => {
            calls.push(args);
            return Promise.resolve({});
        },
        getVersions: () => Promise.resolve([]),
        getProject: () => Promise.resolve(null),
        modifyVersion: () => Promise.resolve(true),
    };
});

import ModrinthPublisher from "../../../../src/publishing/modrinth/modrinth-publisher";

const { calls } = jest.requireMock("../../../../src/utils/modrinth") as { calls: unknown[][] };

function publish(options: Record<string, unknown>): Promise<void> {
    const publisher = new ModrinthPublisher();
    return (publisher as any).publishMod("id", "token", "name", "1.0.0", "release", ["fabric"], ["1.21.1"], [], "", [], [], options);
}

function publishedData(): Record<string, unknown> {
    return calls[0][1] as Record<string, unknown>;
}

describe("ModrinthPublisher.publishMod", () => {
    beforeEach(() => {
        calls.length = 0;
    });

    test("the environment is passed to the API as-is", async () => {
        await publish({ environment: "server_only_client_optional" });

        expect(publishedData().environment).toStrictEqual("server_only_client_optional");
    });

    test("the environment is normalized before it's passed to the API", async () => {
        await publish({ environment: " Client-Only " });

        expect(publishedData().environment).toStrictEqual("client_only");
    });

    test("no environment is sent when none was specified", async () => {
        await publish({});

        expect(publishedData().environment).toBeUndefined();
    });

    test("an unknown environment is rejected", async () => {
        await expect(publish({ environment: "server-side" })).rejects.toThrow();
    });
});
