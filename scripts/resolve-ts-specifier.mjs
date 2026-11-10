export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const hasExtension = /\.[cm]?[jt]s$/.test(specifier);
    if (!hasExtension) {
      try {
        return await nextResolve(`${specifier}.ts`, context);
      } catch {
        /* try the specifier as written */
      }
    }
  }
  return nextResolve(specifier, context);
}
