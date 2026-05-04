export const DATA_ANALYZING_PERFORMATIVE = "EXEC.MASTER.SLAVES.GET";

export const BGPLATFORM = {
  CONTACT_AGENT: "bgplatform[X].contactagent",
  PLATFORM_NAME: "bgplatform[X].platformname",
  SERVER: "bgplatform[X].server",
  IP_ADDRESS: "bgplatform[X].ipaddress",
  URL: "bgplatform[X].url",
  JADE_PORT: "bgplatform[X].jadeport",
  HTTP_MTP: "bgplatform[X].httpmtp",

  VERSION_MAJOR: "bgplatform[X].versionmajor",
  VERSION_MINOR: "bgplatform[X].versionminor",
  VERSION_MICRO: "bgplatform[X].versionmicro",
  VERSION_BUILD: "bgplatform[X].versionbuild",

  OS_NAME: "bgplatform[X].os.name",
  OS_VERSION: "bgplatform[X].os.version",
  OS_ARCHITECTURE: "bgplatform[X].os.architecture",

  CPU_NAME: "bgplatform[X].cpu.name",
  CPU_NUM_LOGICAL: "bgplatform[X].cpu.numlogical",
  CPU_NUM_PHYSICAL: "bgplatform[X].cpu.numphysical",
  CPU_SPEED_MHZ: "bgplatform[X].cpu.speedmhz",

  MEMORY_MB: "bgplatform[X].memorymb",
  BENCHMARK_VALUE: "bgplatform[X].benchmarkvalue",

  TIME_ONLINE_SINCE: "bgplatform[X].time.onlinesince",
  TIME_LAST_CONTACT: "bgplatform[X].time.lastcontact",
  LOCALTIME_ONLINE_SINCE: "bgplatform[X].localtime.onlinesince",
  LOCALTIME_LAST_CONTACT: "bgplatform[X].localtime.lastcontact",

  CURRENTLY_AVAILABLE: "bgplatform[X].currentlyavailable",
  CURRENT_CPU_LOAD: "bgplatform[X].current.cpuload",
  CURRENT_MEMORY_LOAD: "bgplatform[X].current.memoryload",
  CURRENT_MEMORY_LOAD_JVM: "bgplatform[X].current.memoryloadjvm",
  CURRENT_NUM_THREADS: "bgplatform[X].current.numthreads",
  CURRENT_THRESHOLD_EXCEEDED: "bgplatform[X].current.thresholdexceeded",
} as const;

export function bgPlatformKey(template: string, index: number): string {
  return template.replace("[X]", `[${index}]`);
}