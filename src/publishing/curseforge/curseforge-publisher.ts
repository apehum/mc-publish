import File from "../../utils/io/file";
import ModPublisher from "../mod-publisher";
import PublisherTarget from "../publisher-target";
import { convertToCurseForgeVersions, getProjectFileNames, uploadFile } from "../../utils/curseforge";
import Dependency from "../../metadata/dependency";
import DependencyKind from "../../metadata/dependency-kind";
import Environment from "../environment";
import { mapBooleanInput } from "../../utils/actions/input";

const forgeDependencyKinds = new Map([
    [DependencyKind.Depends, "requiredDependency"],
    [DependencyKind.Recommends, "optionalDependency"],
    [DependencyKind.Suggests, "optionalDependency"],
    [DependencyKind.Includes, "embeddedLibrary"],
    [DependencyKind.Breaks, "incompatible"],
]);

export default class CurseForgePublisher extends ModPublisher {
    public get target(): PublisherTarget {
        return PublisherTarget.CurseForge;
    }

    protected async publishMod(id: string, token: string, name: string, _version: string, channel: string, loaders: string[], gameVersions: string[], java: string[], changelog: string, files: File[], dependencies: Dependency[], options: Record<string, unknown>): Promise<void> {
        let parentFileId = undefined;
        const environments = this.resolveEnvironments(options);
        const versions = await convertToCurseForgeVersions(gameVersions, loaders, java, environments, token);
        const existingFileNames = await getProjectFileNames(id);
        const projects = dependencies
            .filter((x, _, self) => x.kind !== DependencyKind.Suggests || !self.find(y => y.id === x.id && y.kind !== DependencyKind.Suggests))
            .map(x => ({
                slug: x.getProjectSlug(this.target),
                type: forgeDependencyKinds.get(x.kind)
            }))
            .filter(x => x.slug && x.type);

        for (const file of files) {
            if (existingFileNames.includes(file.name)) {
                this.logger.info(`File "${file.name}" is already published on CurseForge, skipping`);
                continue;
            }

            const data = {
                changelog,
                changelogType: "markdown",
                displayName: (parentFileId || !name) ? file.name : name,
                parentFileID: parentFileId,
                releaseType: channel,
                gameVersions: parentFileId ? undefined : versions,
                relations: (parentFileId || !projects.length) ? undefined : { projects }
            };

            const fileId = await this.upload(id, data, file, token);
            if (!parentFileId) {
                parentFileId = fileId;
            }
        }
    }

    private resolveEnvironments(options: Record<string, unknown>): string[] {
        const environment = Environment.parseInput(options.environment);
        const sides = environment === undefined ? { client: false, server: false } : Environment.toCurseForgeSides(environment);

        const environments = [
            mapBooleanInput(options.client, sides.client) && "client",
            mapBooleanInput(options.server, sides.server) && "server",
        ].filter((x): x is string => !!x);

        if (!environments.length) {
            throw new Error("CurseForge requires at least one environment. Set \"environment\" (e.g. \"server_only_client_optional\"), or \"curseforge-client\"/\"curseforge-server\" directly");
        }

        return environments;
    }

    private async upload(id: string, data: Record<string, any>, file: File, token: string): Promise<number | never> {
        while (true) {
            try {
                return await uploadFile(id, data, file, token);
            } catch (error) {
                if (error?.info?.errorCode === 1018 && typeof error.info.errorMessage === "string") {
                    const match = error.info.errorMessage.match(/Invalid slug in project relations: '([^']+)'/);
                    const projects = <{ slug: string }[]>data.relations?.projects;
                    if (match && projects?.length) {
                        const invalidSlugIndex = projects.findIndex(x => x.slug === match[1]);
                        if (invalidSlugIndex !== -1) {
                            projects.splice(invalidSlugIndex, 1);
                            continue;
                        }
                    }
                }
                throw error;
            }
        }
    }
}
