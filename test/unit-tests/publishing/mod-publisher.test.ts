import { describe, test, expect } from "@jest/globals";
import { compareFileVersions } from "../../../src/publishing/mod-publisher";

describe("compareFileVersions", () => {
    test("1.x files sort in ascending numeric order", () => {
        const files = [
            "plasmovoice-fabric-1.21.11-2.1.9.jar",
            "plasmovoice-fabric-1.16.5-2.1.9.jar",
            "plasmovoice-fabric-1.21.1-2.1.9.jar",
        ];
        expect([...files].sort(compareFileVersions)).toStrictEqual([
            "plasmovoice-fabric-1.16.5-2.1.9.jar",
            "plasmovoice-fabric-1.21.1-2.1.9.jar",
            "plasmovoice-fabric-1.21.11-2.1.9.jar",
        ]);
    });

    test("non-1.x versions sort after 1.x versions by numeric major", () => {
        const files = [
            "plasmovoice-fabric-26.1-2.1.9.jar",
            "plasmovoice-fabric-1.21.11-2.1.9.jar",
            "plasmovoice-fabric-1.16.5-2.1.9.jar",
        ];
        expect([...files].sort(compareFileVersions)).toStrictEqual([
            "plasmovoice-fabric-1.16.5-2.1.9.jar",
            "plasmovoice-fabric-1.21.11-2.1.9.jar",
            "plasmovoice-fabric-26.1-2.1.9.jar",
        ]);
    });

    test("mc-prefixed versions sort by the minecraft version", () => {
        const files = [
            "sodium-mc1.19-0.4.4.jar",
            "sodium-mc1.18.2-0.4.4.jar",
            "sodium-mc1.20-0.4.4.jar",
        ];
        expect([...files].sort(compareFileVersions)).toStrictEqual([
            "sodium-mc1.18.2-0.4.4.jar",
            "sodium-mc1.19-0.4.4.jar",
            "sodium-mc1.20-0.4.4.jar",
        ]);
    });
});
