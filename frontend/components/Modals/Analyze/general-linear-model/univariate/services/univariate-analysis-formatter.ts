<<<<<<< HEAD
import { ResultJson } from "@/types/Table";
=======
import type { ResultJson } from "@/types/Table";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { formatPart1 } from "./formatter_part1";
import { formatPart2 } from "./formatter_part2";
import { formatPart3 } from "./formatter_part3";

export function transformUnivariateResult(
    data: any,
    errors: string[] = []
): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    formatPart1(data, resultJson);
    formatPart2(data, resultJson);
    formatPart3(data, resultJson, errors);

    return resultJson;
}
