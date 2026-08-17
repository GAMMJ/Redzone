import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

// relativeTime(.fromNow) + 한국어 로케일을 모듈 로드 시 1회만 설정.
// "n분 전 / n시간 전" 표기가 필요한 곳은 이 모듈의 dayjs를 import 한다.
dayjs.extend(relativeTime);
dayjs.locale("ko");

export default dayjs;
