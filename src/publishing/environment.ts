enum Environment {
    ClientAndServer = 1,
    ClientOnly,
    ClientOnlyServerOptional,
    SingleplayerOnly,
    ServerOnly,
    ServerOnlyClientOptional,
    DedicatedServerOnly,
    ClientOrServer,
    ClientOrServerPrefersBoth,
    Unknown,
}

interface CurseForgeSides {
    client: boolean;
    server: boolean;
}

namespace Environment {
    const curseForgeSides = new Map<Environment, CurseForgeSides>([
        [Environment.ClientOnly, { client: true, server: false }],
        [Environment.SingleplayerOnly, { client: true, server: false }],
        [Environment.DedicatedServerOnly, { client: false, server: true }],
        [Environment.Unknown, { client: false, server: false }],
    ]);

    const defaultCurseForgeSides: CurseForgeSides = { client: true, server: true };

    const normalize = (name: string): string => name.replace(/[-_\s]/g, "").toLowerCase();

    export function getValues(): Environment[] {
        return <Environment[]>Object.values(Environment).filter(x => typeof x === "number");
    }

    export function parse(name: string): Environment | undefined {
        const normalizedName = normalize(name);
        return getValues().find(x => normalize(Environment[x]) === normalizedName);
    }

    export function parseInput(value: unknown): Environment | undefined {
        if (typeof value !== "string" || !value.trim()) {
            return undefined;
        }

        const environment = parse(value);
        if (environment === undefined) {
            throw new Error(`Unknown environment "${value.trim()}", expected one of: ${getValues().map(toString).join(", ")}`);
        }
        return environment;
    }

    export function toString(environment: Environment): string {
        const name = Environment[environment];
        if (!name) {
            return environment.toString();
        }
        return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    }

    export function toCurseForgeSides(environment: Environment): CurseForgeSides {
        return curseForgeSides.get(environment) ?? defaultCurseForgeSides;
    }
}

export default Environment;
