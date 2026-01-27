"""Generate probe documentation from lidar probes programmatically."""

import re
from pathlib import Path
from typing import Any

# Tag mappings with descriptions
THREAT_TYPE_MAPPINGS: dict[str, str] = {
    "prompt-injection": "Attacks that attempt to manipulate AI agents through carefully crafted input prompts to override original instructions",
    "training-data-extraction": "Attempts to extract or infer information from the AI model's training data",
    "internal-information-exposure": "Probes designed to extract system prompts, configuration details, or other internal information",
    "data-privacy-exfiltration": "Attacks aimed at extracting sensitive information, personal data, or confidential content from AI systems",
    "harmful-content-generation": "Probes that attempt to bypass safety measures and generate dangerous, illegal, or harmful content across various categories",
    "excessive-agency": "Probes testing whether AI agents can be manipulated to perform actions beyond their intended scope or with inappropriate permissions",
    "denial-of-service": "Probes that attempt to cause resource exhaustion or performance degradation",
    "hallucination": "Tests for AI systems providing false, inconsistent, or fabricated information",
    "brand-damaging-and-reputation": "Tests for reputational risks and brand damage scenarios",
    "legal-and-financial-risk": "Probes targeting potential legal and financial liabilities",
    "misguidance-and-unauthorized-advice": "Probes that test whether AI agents can be manipulated to provide professional advice outside their intended scope",
}

PROBE_TYPE_MAPPINGS: dict[str, str] = {
    "agentic": "Uses autonomous agents to explore and test vulnerabilities through multi-step interactions",
    "multi-turn": "Uses multiple conversation turns to gradually escalate attacks or extract information",
}

OWASP_LLM_MAPPINGS: dict[str, str] = {
    "LLM01": "Prompt Injection: Prompt Injection occurs when an attacker manipulates an LLM's behavior by injecting malicious input. These attacks exploit how LLMs process text-based prompts, often bypassing safeguards, compromising outputs, or enabling unauthorized access. The vulnerability lies in the model's inability to distinguish between safe and malicious inputs, even if imperceptible to humans. Prompt Injection attacks can range from causing the LLM to generate harmful outputs to accessing sensitive data or performing unauthorized actions",
    "LLM02": "Sensitive Information Disclosure: Sensitive Information Disclosure happens when an LLM unintentionally reveals private or proprietary information. This can include PII, system credentials, or confidential business data. The risk arises from improper data sanitization, poor input handling, or overly permissive outputs. Attackers or users may exploit these vulnerabilities, leading to privacy violations, data breaches, or compliance issues",
    "LLM03": "Supply Chain: The supply chain for LLM applications includes training datasets, pre-trained models, and deployment platforms. Vulnerabilities arise when attackers tamper with these components, introducing biases, hidden backdoors, or insecure dependencies. These threats are amplified by reliance on third-party tools and repositories",
    "LLM04": "Data and Model Poisoning: Data poisoning involves malicious or accidental contamination of training, fine-tuning, or embedding data, leading to biased, erroneous, or harmful model behavior. Attackers may embed triggers or manipulate data to alter outputs in their favor, effectively creating backdoors or disrupting model functionality",
    "LLM05": "Improper Output Handling: Improper Output Handling occurs when an LLM's responses are not adequately validated, sanitized, or encoded before being passed to downstream systems. This can result in vulnerabilities such as cross-site scripting (XSS), SQL injection, or unauthorized system commands",
    "LLM06": "Excessive Agency: Excessive Agency occurs when an LLM is granted too much functionality, permissions, or autonomy, enabling it to perform unintended or harmful actions. This risk arises from poorly designed system extensions or insufficient control over LLM operations. The consequences range from data misuse to unauthorized system actions, often exacerbated by insufficient human oversight",
    "LLM07": "System Prompt Leakage: System Prompt Leakage happens when internal prompts, instructions, or configurations used to guide an LLM's behavior are exposed. These prompts may contain sensitive details, like API keys or application rules, which attackers can exploit to bypass restrictions or compromise systems. The risk lies in embedding sensitive information directly into the prompts",
    "LLM08": "Vector and Embedding Weaknesses: Vector and Embedding Weaknesses arise when data stored in embeddings or vector databases is accessed or manipulated improperly. These vulnerabilities can lead to information leaks, poisoning attacks, or altered model behavior. In systems using retrieval-augmented generation (RAG), mismanagement of embeddings amplifies these risks",
    "LLM09": "Misinformation: Misinformation involves LLMs generating outputs that appear credible but are factually incorrect. These issues often stem from hallucinations, biases in training data, or incomplete knowledge. Misinformation can lead to poor decisions, reputational damage, or legal liabilities, especially in high-stakes contexts like healthcare or finance",
    "LLM10": "Unbounded Consumption: Unbounded Consumption occurs when an LLM application allows excessive or uncontrolled resource usage. This vulnerability can lead to denial of service (DoS), financial exploitation, or unauthorized replication of the model. Risks are amplified by high computational demands, especially in pay-per-use cloud environments",
}

def threat_type_to_filename(threat_type: str) -> str:
    """Convert threat type ID to RST filename."""
    return threat_type


def get_category_description(threat_type: str) -> str:
    """Get category description from threat type mappings."""
    if threat_type not in THREAT_TYPE_MAPPINGS:
        raise ValueError(
            f"Threat type '{threat_type}' not found in THREAT_TYPE_MAPPINGS. "
            f"Available threat types: {list(THREAT_TYPE_MAPPINGS.keys())}"
        )
    return THREAT_TYPE_MAPPINGS[threat_type]


def extract_threat_type(tags: list[str]) -> str | None:
    """Extract threat type from probe tags."""
    for tag in tags:
        if tag.startswith("gsk:threat-type="):
            # Extract value from 'gsk:threat-type='value''
            match = re.search(r"gsk:threat-type='([^']+)'", tag)
            if match:
                return match.group(1)
    return None


def extract_probe_type(tags: list[str]) -> str | None:
    """Extract probe type from probe tags."""
    for tag in tags:
        if tag.startswith("gsk:probe-type="):
            # Extract value from 'gsk:probe-type='value''
            match = re.search(r"gsk:probe-type='([^']+)'", tag)
            if match:
                return match.group(1)
    return None


def extract_owasp_tags(tags: list[str]) -> list[str]:
    """Extract OWASP LLM Top 10 tags from probe tags.

    Returns:
        List of OWASP tag values (e.g., ['LLM01', 'LLM02'])
    """
    owasp_tags = []
    for tag in tags:
        if tag.startswith("owasp:llm-top-10"):
            # Extract OWASP tags
            match = re.search(r"owasp:llm-top-10-\d{4}='([^']+)'", tag)
            if match:
                owasp_tags.append(match.group(1))
    return owasp_tags


def clean_probe_name(name: str) -> str:
    """Remove 'Probe' suffix from probe name (handles both ' Probe' and 'Probe')."""
    # Remove " Probe" suffix (with space)
    if name.endswith(" Probe"):
        return name[:-6]
    # Remove "Probe" suffix (without space) - less common but possible
    if name.endswith("Probe"):
        return name[:-5]
    return name


def validate_tags(tags: list[str], probe_name: str, probe_id: str) -> None:
    """Validate that all tag values are defined in the mappings.

    If any threat-type, probe-type, or OWASP tags are defined, they MUST be present
    in the corresponding mappings or an error will be raised.

    Raises:
        ValueError: If any tag value is not defined in the mappings.
    """
    missing_threat_types = []
    missing_probe_types = []
    missing_owasp = []

    # Validate threat-type: if defined, must be in mappings
    threat_type = extract_threat_type(tags)
    if threat_type is not None:
        if threat_type not in THREAT_TYPE_MAPPINGS:
            missing_threat_types.append(threat_type)

    # Validate probe-type: if defined, must be in mappings
    probe_type = extract_probe_type(tags)
    if probe_type is not None:
        if probe_type not in PROBE_TYPE_MAPPINGS:
            missing_probe_types.append(probe_type)

    # Validate OWASP tags: if any are defined, they must all be in mappings
    owasp_tags = extract_owasp_tags(tags)
    if owasp_tags:
        for owasp_tag in owasp_tags:
            if owasp_tag not in OWASP_LLM_MAPPINGS:
                missing_owasp.append(owasp_tag)

    # Raise error if any tags are missing from mappings
    errors = []
    if missing_threat_types:
        errors.append(
            f"threat-type values not in mappings: {missing_threat_types} "
            f"(available: {list(THREAT_TYPE_MAPPINGS.keys())})"
        )
    if missing_probe_types:
        errors.append(
            f"probe-type values not in mappings: {missing_probe_types} "
            f"(available: {list(PROBE_TYPE_MAPPINGS.keys())})"
        )
    if missing_owasp:
        errors.append(
            f"OWASP LLM Top 10 values not in mappings: {missing_owasp} "
            f"(available: {list(OWASP_LLM_MAPPINGS.keys())})"
        )

    if errors:
        raise ValueError(
            f"Probe {probe_name} (id: {probe_id}) has tags with undefined values: "
            f"{'; '.join(errors)}. Current tags: {tags}"
        )


def discover_probe_classes() -> list[type]:
    """Discover all Probe classes from lidar using ProbeRegistry."""
    from lidar.utils.probe_registry import ProbeRegistry

    probe_registry = ProbeRegistry()
    return probe_registry.get_probes()


def get_probe_info(probe_class: type) -> dict[str, Any]:
    """Get probe information using the Probe.info() method.

    Validates that each probe has both an id and a threat type.
    """
    try:
        # Validate probe has id
        if not hasattr(probe_class, "id") or not probe_class.id:
            raise ValueError(
                f"Probe {probe_class.__name__} is missing required 'id' attribute"
            )

        info = probe_class.info()
        threat_type = extract_threat_type(info.tags)

        # Validate probe has threat type
        if not threat_type:
            raise ValueError(
                f"Probe {probe_class.__name__} (id: {info.id}) is missing required "
                f"'gsk:threat-type' tag in tags. Current tags: {info.tags}"
            )

        # Validate all tags are defined in mappings
        validate_tags(info.tags, probe_class.__name__, info.id)

        probe_type = extract_probe_type(info.tags)
        owasp_tags = extract_owasp_tags(info.tags)
        return {
            "id": info.id,
            "name": info.name,
            "description": info.desc,
            "tags": info.tags,
            "threat_type": threat_type,
            "probe_type": probe_type,
            "owasp_tags": owasp_tags,
            "class_name": probe_class.__name__,
        }
    except Exception as e:
        print(f"Error: Could not get info for {probe_class.__name__}: {e}")
        raise  # Re-raise to fail the build if probes are invalid


def group_probes_by_category(probes: list[dict]) -> dict[str, list[dict]]:
    """Group probes by threat type category."""
    grouped: dict[str, list[dict]] = {}
    for probe in probes:
        threat_type = probe.get("threat_type")
        if threat_type:
            if threat_type not in grouped:
                grouped[threat_type] = []
            grouped[threat_type].append(probe)
    return grouped


def generate_rst_content(category: str, probes: list[dict], probe_infos: list[dict]) -> str:
    """Generate RST content for a vulnerability category."""
    filename = threat_type_to_filename(category)

    # Get category title from filename
    title = filename.replace("-", " ").title()

    # Collect all OWASP tags from probes in this category (many-to-many mapping)
    owasp_tags = set()
    for probe in probes:
        probe_owasp_tags = probe.get("owasp_tags", [])
        owasp_tags.update(probe_owasp_tags)

    # Build RST content
    # Get description from threat type mappings
    description = get_category_description(category)

    # Use plain title (no OWASP tags) for sidebar navigation
    display_title = title

    lines = [
        f":og:title: Giskard Hub UI - {title} Vulnerabilities",
        "",
        f":og:description: Comprehensive guide to {title.lower()} vulnerabilities in AI systems.",
        "",
        display_title,
        "=" * len(display_title),
        "",
        description,
        "",
    ]

    # Add OWASP section if there are OWASP mappings
    if owasp_tags:
        lines.extend([
            "OWASP LLM Top 10",
            "-" * len("OWASP LLM Top 10"),
            "",
        ])

        # Add OWASP entries
        for owasp_num in sorted(owasp_tags):
            owasp_desc = OWASP_LLM_MAPPINGS.get(owasp_num, "")
            lines.extend([
                f"**OWASP {owasp_num}:** {owasp_desc}",
                "",
            ])

    # Group probes by subcategory if needed (for now, just list all)
    # Simple format: just list all probes in a table
    lines.extend(
        [
            "Probes",
            "-" * len("Probes"),
            "",
            ".. list-table::",
            "   :header-rows: 1",
            "   :widths: 20 15 65",
            "",
            "   * - Probe Name",
            "     - Type",
            "     - Description",
        ]
    )

    for probe in sorted(probes, key=lambda x: x["name"]):
        name = clean_probe_name(probe["name"])
        probe_type = probe.get("probe_type")
        # Format probe type for display
        if probe_type == "agentic":
            type_display = "Agentic"
        elif probe_type == "multi-turn":
            type_display = "Multi-turn"
        else:
            type_display = ""

        description = probe["description"] or "No description available."
        # Clean up description - remove extra whitespace
        description = " ".join(description.split())
        lines.extend(
            [
                f"   * - {name}",
                f"     - {type_display}",
                f"     - {description}",
            ]
        )

    return "\n".join(lines)


def update_probe_documentation():
    """Main function to discover probes and update documentation."""
    print("Discovering probe classes...")
    probe_classes = discover_probe_classes()

    if not probe_classes:
        raise RuntimeError(
            "No probe classes found. Cannot generate documentation. "
            "Make sure lidar submodule is initialized and dependencies are installed."
        )

    print(f"Found {len(probe_classes)} probe classes")

    print("Extracting probe information...")
    probe_infos = []
    for cls in probe_classes:
        try:
            info = get_probe_info(cls)
            if info:
                probe_infos.append(info)
        except Exception as e:
            print(f"Error: Failed to extract info from {cls.__name__}: {e}")
            raise  # Fail the build if any probe is invalid

    if not probe_infos:
        raise RuntimeError(
            "No probe information extracted. Cannot generate documentation."
        )

    print("Grouping probes by category...")
    grouped = group_probes_by_category(probe_infos)

    if not grouped:
        raise RuntimeError(
            "No probes grouped by category. Cannot generate documentation. "
            "Make sure probes have valid threat type tags."
        )

    # Update RST files
    # __file__ is in scripts/, so parent.parent is repo root
    repo_root = Path(__file__).parent.parent
    docs_dir = repo_root / "source" / "hub" / "ui" / "scan" / "vulnerability-categories"

    # Ensure the directory exists
    docs_dir.mkdir(parents=True, exist_ok=True)

    # Remove all RST files except index.rst before generating new ones
    removed_count = 0
    for rst_file in docs_dir.glob("*.rst"):
        if rst_file.name == "index.rst":
            continue
        print(f"Removing existing file: {rst_file}")
        rst_file.unlink()
        removed_count += 1
    if removed_count > 0:
        print(f"Removed {removed_count} existing category file(s)")

    # Get all current filenames that should exist
    expected_files = set()
    for category, probes in grouped.items():
        filename = threat_type_to_filename(category)
        expected_files.add(filename)
        rst_file = docs_dir / f"{filename}.rst"
        print(
            f"Generating {rst_file} with {len(probes)} probes for threat type '{category}'..."
        )

        content = generate_rst_content(category, probes, probe_infos)
        if content:
            rst_file.write_text(content, encoding="utf-8")
            print(f"Updated {rst_file}")
        else:
            print(f"Warning: No content generated for {rst_file}")

    # Update index.rst completely (includes grid cards, OWASP section, and probe count overview)
    update_index_file(docs_dir, grouped, probe_infos, expected_files)


def get_owasp_mapping(probe_infos: list[dict]) -> dict[str, list[str]]:
    """Build mapping from OWASP LLM numbers to threat type filenames.

    Returns:
        Dictionary mapping OWASP tag to list of threat type filenames (many-to-many)
    """
    owasp_to_threat: dict[str, list[str]] = {}

    for probe in probe_infos:
        threat_type = probe.get("threat_type")
        owasp_tags = probe.get("owasp_tags", [])
        if threat_type:
            filename = threat_type_to_filename(threat_type)
            for owasp_tag in owasp_tags:
                # Build many-to-many mapping: each OWASP tag can map to multiple threat types
                if owasp_tag not in owasp_to_threat:
                    owasp_to_threat[owasp_tag] = []
                if filename not in owasp_to_threat[owasp_tag]:
                    owasp_to_threat[owasp_tag].append(filename)

    return owasp_to_threat


def update_index_file(
    docs_dir: Path, grouped: dict[str, list[dict]], probe_infos: list[dict], expected_files: set[str]
):
    """Dynamically generate the entire index.rst file."""
    index_file = docs_dir / "index.rst"

    # Build reverse mapping: threat type -> list of OWASP tags
    # Collect all OWASP tags from probes in each threat type category
    threat_to_owasp: dict[str, list[str]] = {}

    for threat_type, probes in grouped.items():
        filename = threat_type_to_filename(threat_type)
        owasp_tags = set()
        for probe in probes:
            probe_owasp_tags = probe.get("owasp_tags", [])
            owasp_tags.update(probe_owasp_tags)
        if owasp_tags:
            threat_to_owasp[filename] = sorted(list(owasp_tags))

    # Build list of all threat types with their metadata
    threat_type_entries = []
    for threat_type in grouped.keys():
        filename = threat_type_to_filename(threat_type)
        title = filename.replace("-", " ").title()
        description = THREAT_TYPE_MAPPINGS.get(threat_type, "")
        count = len(grouped[threat_type])

        # Get OWASP references for this threat type
        owasp_refs = threat_to_owasp.get(filename, [])

        # Use plain title (no OWASP tags) for sidebar navigation
        display_title = title

        entry = {
            "threat_type": threat_type,
            "filename": filename,
            "title": title,
            "display_title": display_title,
            "description": description,
            "count": count,
            "owasp_refs_list": owasp_refs,
        }
        threat_type_entries.append(entry)

    # Sort by OWASP number (LLM01-LLM10)
    # Categories without OWASP mappings come last, sorted alphabetically
    def get_owasp_sort_key(entry: dict) -> tuple[int, str]:
        """Get sort key: (owasp_number, title) for sorting by OWASP then alphabetically."""
        owasp_refs = entry.get("owasp_refs_list", [])
        if owasp_refs:
            # Extract the number from the first OWASP ref (e.g., "LLM01" -> 1)
            first_owasp = sorted(owasp_refs)[0]
            owasp_num = int(first_owasp.replace("LLM", ""))
            return (owasp_num, entry["title"])
        else:
            # No OWASP mapping - put at end (use 999 as placeholder)
            return (999, entry["title"])

    threat_type_entries.sort(key=get_owasp_sort_key)

    # Build toctree - sorted by OWASP order (same as grid)
    # Create a mapping from filename to sort order
    filename_to_sort_key: dict[str, tuple[int, str]] = {}
    for entry in threat_type_entries:
        filename_to_sort_key[entry['filename']] = get_owasp_sort_key(entry)

    # Sort filenames by their OWASP sort key
    sorted_filenames = sorted(expected_files, key=lambda f: filename_to_sort_key.get(f, (999, f)))

    toctree_items = []
    for filename in sorted_filenames:
        toctree_items.append(f"   {filename}")

    # Generate grid section for all threat types
    grid_items = []
    if threat_type_entries:
        grid_items.append(".. grid:: 2")
        grid_items.append("")
        for entry in threat_type_entries:
            grid_items.extend(
                [
                    f"    .. grid-item-card:: {entry['display_title']}",
                    f"      :link: {entry['filename']}",
                    "      :link-type: doc",
                    "",
                ]
            )

            # Add description and probe count (OWASP removed from cards)
            card_lines = []
            if entry['description']:
                card_lines.append(f"      {entry['description']}")
            if entry['count']:
                card_lines.append("")
                card_lines.append(f"      **Probes:** {entry['count']}")

            if card_lines:
                grid_items.extend(card_lines)
                grid_items.append("")

    # Generate the complete index content
    content = f""":og:title: Giskard Hub UI - AI Vulnerability Categories and Attack Patterns

:og:description: Comprehensive guide to AI security vulnerabilities and attack patterns tested by Giskard's vulnerability scan. Understand OWASP LLM Top 10 risks, mitigation strategies, and security testing approaches.


Attack categories
=================

Comprehensive guide to AI security vulnerabilities and attack patterns tested by Giskard's vulnerability scan.

The vulnerability scan uses specialized **probes** (structured adversarial tests) to stress-test AI systems and uncover weaknesses before malicious actors do. Each probe is designed to expose specific vulnerabilities in AI agents, from harmful content generation to unauthorized system access.

This catalog organizes vulnerabilities by risk category and provides detailed information about:

- Attack patterns and techniques
- Specific probes used for testing
- Detection indicators
- Mitigation strategies
- Risk levels and business impact

Use this guide to understand the security landscape for AI systems and make informed decisions about which vulnerabilities to prioritize in your testing.

Overview
--------

At Giskard, we use probes to stress-test AI systems and uncover vulnerabilities before malicious actors do. A probe is a structured adversarial test designed to expose weaknesses in an AI agent, such as harmful content generation, data leakage, or unauthorized tool execution. By simulating real-world attacks, probes help teams identify and fix risks early—reducing both security threats and business failures.

Below you'll find the full catalog of probes, organized by vulnerability category. Each category includes a short explanation and detailed information about the corresponding probes.

{"\n".join(grid_items)}

.. toctree::
   :maxdepth: 2
   :caption: Vulnerability Categories
   :hidden:

{"\n".join(toctree_items)}
"""

    index_file.write_text(content, encoding="utf-8")
    print(f"Updated {index_file} with complete dynamic content")


if __name__ == "__main__":
    update_probe_documentation()
