// 매치 텔레메트리에서 뽑아낸 요약.
// 원본은 이벤트 5만 개에 30MB가 넘어 그대로 쓸 수 없다. 화면이 필요한 것만 남긴다.
// 전체 구조는 docs/local/TELEMETRY.md 참고.

/** 지도에 찍을 좌표. 단위는 미터(원본 1 = 1cm를 100으로 나눈 값). */
export interface TelemetryPoint {
  x: number;
  y: number;
}

export interface TelemetryKill {
  /** 매치 시작 기준 경과 초 */
  at: number;
  /** 자기장·낙하 등으로 죽으면 가해자가 없다 */
  killer: string | null;
  victim: string;
  /** 무엇에 죽었나. 무기 이름이거나 자기장·낙하 같은 원인 */
  weapon: string;
  distanceM: number;
  /** HeadShot · TorsoShot 등. 없으면 빈 문자열 */
  bodyPart: string;
  isSuicide: boolean;
  killerAt: TelemetryPoint | null;
  victimAt: TelemetryPoint;
}

export interface TelemetryGroggy {
  at: number;
  attacker: string | null;
  victim: string;
  weapon: string;
  distanceM: number;
  /** 킬과 마찬가지로 부위가 기록된다. 없으면 빈 문자열 */
  bodyPart: string;
}

export interface TelemetryRevive {
  at: number;
  reviver: string;
  victim: string;
}

/** 플레이어가 쓴 무기 하나. 딜량 내림차순으로 정렬해 첫 항목이 주무기다. */
export interface TelemetryWeaponUse {
  weapon: string;
  damage: number;
}

export interface MatchTelemetry {
  /** 매치 시작 시각(ISO). at 값은 이 시각 기준 경과 초다. */
  startedAt: string;
  kills: TelemetryKill[];
  groggy: TelemetryGroggy[];
  revives: TelemetryRevive[];
  /** 플레이어 이름 → 무기별 딜량(내림차순, 상위 몇 개만) */
  weaponsByPlayer: Record<string, TelemetryWeaponUse[]>;
  /** 플레이어 이름 → 받은 피해 합계. 매치 API에는 없는 지표다. */
  damageTakenByPlayer: Record<string, number>;
}
