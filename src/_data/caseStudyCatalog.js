const definitions = [
  {
    id: "infrastructure-changes",
    folder: "making-infrastructure-changes-boring",
    legacyFolder: "01-making-infrastructure-changes-boring",
  },
  {
    id: "audited-approve",
    folder: "approve-the-audited-escape-hatch",
    legacyFolder: "02-approve-the-audited-escape-hatch",
  },
  {
    id: "self-service-buttons",
    folder: "buttons-instead-of-incantations",
    legacyFolder: "03-buttons-instead-of-incantations",
  },
  {
    id: "fast-feedback",
    folder: "a-feedback-loop-measured-in-milliseconds",
    legacyFolder: "04-a-feedback-loop-measured-in-milliseconds",
  },
  {
    id: "tool-versions",
    folder: "one-tool-version-everywhere",
    legacyFolder: "05-one-tool-version-everywhere",
  },
  {
    id: "self-service-teams",
    folder: "teams-that-create-themselves",
    legacyFolder: "06-teams-that-create-themselves",
  },
  {
    id: "terraform-product",
    folder: "turning-a-terraform-repository-into-a-product",
    legacyFolder: "07-turning-a-terraform-repository-into-a-product",
  },
  {
    id: "dependency-updates",
    folder: "dependency-updates-from-quarterly-panic-to-background-noise",
    legacyFolder: "08-dependency-updates-from-quarterly-panic-to-background-noise",
  },
  {
    id: "kubernetes-upgrades",
    folder: "kubernetes-upgrades",
    legacyFolder: "09-kubernetes-upgrades",
  },
  {
    id: "policy-engine",
    folder: "kyverno-at-the-cluster-door",
    legacyFolder: "10-kyverno-at-the-cluster-door",
  },
  {
    id: "kafka-topics",
    folder: "kafka-topics-as-code",
    legacyFolder: "11-kafka-topics-as-code",
  },
  {
    id: "fleet-patching",
    folder: "the-fleet-that-patches-itself",
    legacyFolder: "12-the-fleet-that-patches-itself",
  },
  {
    id: "network-rebuild",
    folder: "the-network-nobody-dared-touch",
    legacyFolder: "13-the-network-nobody-dared-touch",
  },
  {
    id: "ephemeral-environments",
    folder: "environments-you-can-create-and-destroy-with-one-command",
    legacyFolder: "14-environments-you-can-create-and-destroy-with-one-command",
  },
  {
    id: "nat-cost",
    folder: "the-nat-bill-and-the-open-source-fix-i-helped-ship",
    legacyFolder: "15-the-nat-bill-and-the-open-source-fix-i-helped-ship",
  },
  {
    id: "acquisition-migration",
    folder: "absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved",
    legacyFolder: "16-absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved",
  },
  {
    id: "registry-migration",
    folder: "leaving-docker-hub-without-anyone-noticing",
    legacyFolder: "17-leaving-docker-hub-without-anyone-noticing",
  },
  {
    id: "provider-fork",
    folder: "the-fork-that-needed-a-home",
    legacyFolder: "18-the-fork-that-needed-a-home",
  },
  {
    id: "container-supply-chain",
    folder: "turning-container-images-from-a-liability-into-a-supply-chain",
    legacyFolder: "19-turning-container-images-from-a-liability-into-a-supply-chain",
  },
  {
    id: "cloud-functions",
    folder: "customer-code-running-safely-self-service-cloud-functions",
    legacyFolder: "21-customer-code-running-safely-self-service-cloud-functions",
  },
  {
    id: "ai-tooling",
    folder: "safe-ai-tooling-for-every-developer",
    legacyFolder: "22-safe-ai-tooling-for-every-developer",
  },
  {
    id: "agent-ready-codebase",
    folder: "a-codebase-whose-newest-users-are-ai-agents",
    legacyFolder: "23-a-codebase-whose-newest-users-are-ai-agents",
  },
];

const STABLE_SEGMENT = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const LEGACY_FOLDER = /^(0*[1-9]\d*)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function createCaseStudyCatalog(entries) {
  if (!Array.isArray(entries)) throw new TypeError("Case-study catalog must be an array");

  const ids = new Set();
  const folders = new Set();
  const legacyFolders = new Set();
  const legacyNumbers = new Set();

  return Object.freeze(
    entries.map((entry, index) => {
      if (typeof entry.id !== "string" || !STABLE_SEGMENT.test(entry.id)) {
        throw new TypeError(`Catalog entry ${index + 1}: id must be a lowercase URL segment starting with a letter`);
      }
      if (ids.has(entry.id)) throw new TypeError(`Catalog entry ${index + 1}: duplicate id ${entry.id}`);
      ids.add(entry.id);

      if (typeof entry.folder !== "string" || !STABLE_SEGMENT.test(entry.folder)) {
        throw new TypeError(`Catalog entry ${index + 1}: folder must be a lowercase URL segment starting with a letter`);
      }
      if (folders.has(entry.folder)) {
        throw new TypeError(`Catalog entry ${index + 1}: duplicate folder ${entry.folder}`);
      }
      folders.add(entry.folder);

      let legacyNumber = null;
      if (entry.legacyFolder !== undefined) {
        const match = typeof entry.legacyFolder === "string" && entry.legacyFolder.match(LEGACY_FOLDER);
        if (!match) {
          throw new TypeError(`Catalog entry ${index + 1}: legacyFolder must be a numbered URL segment`);
        }
        if (legacyFolders.has(entry.legacyFolder)) {
          throw new TypeError(`Catalog entry ${index + 1}: duplicate legacyFolder ${entry.legacyFolder}`);
        }
        legacyFolders.add(entry.legacyFolder);
        legacyNumber = Number.parseInt(match[1], 10);
        if (!Number.isSafeInteger(legacyNumber)) {
          throw new TypeError(`Catalog entry ${index + 1}: legacy number must be a safe integer`);
        }
        if (legacyNumbers.has(legacyNumber)) {
          throw new TypeError(`Catalog entry ${index + 1}: duplicate legacy number ${legacyNumber}`);
        }
        legacyNumbers.add(legacyNumber);
      }

      return Object.freeze({ ...entry, legacyNumber, number: index + 1 });
    }),
  );
}

const caseStudyCatalog = createCaseStudyCatalog(definitions);

export default caseStudyCatalog;
