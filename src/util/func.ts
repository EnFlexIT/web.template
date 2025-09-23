export function foldl<a, b>(f: (acc: a, curr: b) => a, acc: a, currs: b[]): a {
    if (currs.length === 0) {
        return acc
    } else {
        return foldl(f, f(acc, currs.slice(0, 1).at(0)!), currs.slice(1))
    }
}

export function map<a, b>(f: (curr: a) => b, xs: a[]): b[] {
    if (xs.length === 0) {
        return []
    } else {
        return [f(xs.slice(0, 1).at(0)!), ...map(f, xs.slice(1))]
    }
}
