/**
 * This function picks a random element from the given array and returns it.
 * @param arr Array of typed elements, unknown length, unknown type
 * @returns {A} Single typed element
 */
export function randArrPos<A>(arr: A[]): A {
    return arr[((arr?.length ?? 0) > 1) ? Math.floor(Math.random() * arr.length) : 0];
}

/**
 * This function rolls a random number between the given min/max values inclusively. 
 * @param min Minimum value for range
 * @param max Maximum value for range
 * @returns Number between min-max inclusively
 */
export function incRandNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * This function rolls `Math.random()` and checks if the given `chance >= Math.random()`
 * @param chance `0 < chance < 1`
 * @returns True if condition passes
 */
export function rollChanceGTE(chance: number): boolean {
    return Math.random() <= chance;
}

/**
 * This function rolls `Math.random()` and checks if the given `chance <= Math.random()`
 * @param chance `0 < chance < 1`
 * @returns True if condition passes
 */
export function rollChanceLTE(chance: number): boolean {
    return Math.random() >= chance;
}

/**
 * This function picks `x` number of elements from `arr` returning the selected elements as an array
 * 
 * @param arr Array of typed elements, unknown length, unknown type
 * @param x Number of elements to pick at random from `arr`
 * @param p READONLY: Evaluates `x` to a valid paramater
 * @returns {A[]} Array containing all selected elements
 */
export function arrFromRandArrPos<A>(arr: A[], x = 1, p = (x > arr.length) ? arr.length - 1 : x): A[] {
    const arrCpy = arr.slice();
    const finalChoices: A[] = [];
    for (let i = 0; i < p; i++) {
        const idxPicked = incRandNum(0, arrCpy.length - 1);
        finalChoices.push(...arrCpy.splice(idxPicked, 1));
    }
    return finalChoices;
}