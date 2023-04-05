# data-go-kr

## 개요

[공공데이터포털](https://www.data.go.kr/) 의 OpenAPI 를 요청하는 CLI 툴 입니다.

## How to Use

전역 설치

```
npm install -g data-go-kr-cli

data-go-kr --config <config-path>
```

npx 사용

```
npx data-go-kr --config <config-path>
```

성공 시 표준 출력으로, 실패 시 표준 에러로 결과를 출력합니다.

## Config File

공공데이터 API 요청 시 필요한 파라미터들을 설정해놓은 파일입니다.

`config/config.template.json`을 참고해주세요.

```
{
    "serviceKey": "your serviceKey",
    "authType": "header|query",
    "endpoint": "api endpoint",
    "serviceName": "service name",
  // and you want...
}
```

`serviceKey`, `authType`, `endpoint`, `serviceName` 은 필수 값 입니다.

그외에 다른 파라미터들은 추가로 정의하면 됩니다.

ex)

```
{
    ...,
    "serviceName": "service name",
    "resultType": "json",
    "crno": "1101113892240",
    "corpNm": "메리츠자산운용"
}
```

각 서비스 별로 필요한 파라미터 정보는 그 서비스의 API Spec 을 참고해주세요.

## CLI Option

```
Options:
  -c, --config <string>       공공데이터 API 요청 시 필요한 파라미터들의 설정 파일 경로 (required)
  -r, --max-retries <number>  요청 실패 시 최대 재시도 회수 (default: 5)
  -d, --delay <number>        요청 실패 시 재시도 전 대기시간 (ms) (default: 1000)
  -n, --num-of-rows <number>  페이지 당 불러올 행의 개수 (default: 10)
  -p, --page-no <number>      페이지 번호 (default: 1)
  --pretty <indent>           이쁘게 출력
  --no-num-of-rows            기본 페이지네이션 파라미터(num-of-rows)를 사용하지 않음
  --no-page-no                기본 페이지네이션 파라미터(page-no)를 사용하지 않음
```

기본적으로 페이지네이션은 `numOfRows`, `pageNo` 쿼리 파라미터를 사용합니다.

페이지네이션 방식이 다른 경우 `--no-num-of-rows`, `--no-page-no` 파라미터를 사용하고,

`config.json` 파일에 페이지네이션 파라미터를 삽입해주세요.

## Error Handling

오류는 모두 표준 에러로 출력합니다.

exit code 는 1 입니다.

### OpenAPI Error

OpenAPI 에서 출력되는 오류메세지는 XML 로만 출력되며, 형태는 아래와 같습니다.

```xml

<OpenAPI_ServiceResponse>
    <cmmMsgHeader>
        <errMsg>SERVICE ERROR</errMsg>
        <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
        <returnReasonCode>30</returnReasonCode>
    </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

| 에러코드 | 에러메세지                                            | 설명                     |
|------|--------------------------------------------------|------------------------|
| 1    | APPLICATION ERROR                                | 어플리케이션 에러              |
| 4    | HTTP_ERROR                                       | HTTP 에러                |
| 12   | NO_OPENAPI_SERVICE_ERROR                         | 해당 오픈 API 서비스가 없거나 폐기됨 |
| 20   | SERVICE_ACCESS_DENIED_ERROR                      | 서비스 접근거부               |
| 22   | LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR | 서비스 요청제한횟수 초과에러        |
| 30   | SERVICE_KEY_IS_NOT_REGISTERED_ERROR              | 등록되지 않은 서비스키           |
| 31   | DEADLINE_HAS_EXPIRED_ERROR                       | 활용기간 만료                |
| 32   | UNREGISTERED_IP_ERROR                            | 등록되지 않은 IP             |
| 99   | UNKNOWN_ERROR                                    | 기타에러                   |

### Application Error

CLI 툴 자체의 에러는 아래와 같은 포맷으로 출력됩니다.

```
error: maxRetries should be integer and greater than 0
```

## Example

[금융위원회_기업기본정보](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15043184)

### Config

```json
{
  "serviceKey": "<service key>",
  "authType": "query",
  "endpoint": "http://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/",
  "serviceName": "getCorpOutline_V2",
  "resultType": "json",
  "crno": "1101113892240",
  "corpNm": "메리츠자산운용"
}
```

### Command

```shell
data-go-kr --config config.getCorpOutline_V2.json
```

### Response

```
{"response":{"body":{"items":{"item":[{"crno":"1101113892240","corpNm":"메리츠자산운용","corpEnsnNm":"Meritz Asset Management","enpPbanCmpyNm":"메리츠자산운용","enpRprFnm":"이동진","corpRegMrktDcd":"E","corpRegMrktDcdNm":"기타","corpDcd""bzno":"1078708658","enpOzpno":"03051","enpBsadr":"서울특별시 종로구 북촌로 104 계동빌딩","enpDtadr":"서울특별시 종로구 북촌로 104 계동빌딩","enpHmpgUrl":"","enpTlno":"02-6320-3000","enpFxno":"02-6320-3009","sicNm":"64201","enpEstbDt":"2XchgLstgDt":"","enpXchgLstgAbolDt":"","enpKosdaqLstgDt":"","enpKosdaqLstgAbolDt":"","enpKrxLstgDt":"","enpKrxLstgAbolDt":"","smenpYn":"","enpMntrBnkNm":"","enpEmpeCnt":"0","empeAvgCnwkTermCtt":"","enpPn1AvgSlryAmt":"0","actnAudpnNm":"","audtRptOpnnCtt":"","enpMainBizNm":"","fssCorpUnqNo":"00685935","fssCorpChgDtm":"2023/03/20","fstOpegDt":"20230320","lastOpegDt":"20230404"},{"crno":"1101113892240","corpNm":"메리츠자산운용","corpEnsnNm":"Meritz Asset Management","enpPbanCmpyNm":"메리츠자산운용","enpRprFnm":"John Lee(이정복)","corpRegMrktDcd":"E","corpRegMrktDcdNm":"기타","corpDcd":"","corpDcdNm":"","bzno":"1078708658","enpOzpno":"03051","enpBsadr":"서울특별시 종로구 북촌로 104 계동빌딩","enpDtadr":"서울gUrl":"","enpTlno":"02-6320-3000","enpFxno":"02-6320-3009","sicNm":"64201","enpEstbDt":"20080506","enpStacMm":"12","enpXchgLstgDt":"","enpXchgLstgAbolDt":"","enpKosdaqLstgDt":"","enpKosdaqLstgAbolDt":"","enpKrxLstgDt":"","enpKrxLstgAbolDt":"","smenpYn":"","enpMntrBnkNm":"","enpEmpeCnt":"0","empeAvgCnwkTermCtt":"","enpPn1AvgSlryAmt":"0","actnAudpnNm":"","audtRptOpnnCtt":"","enpMainBizNm":"","fssCorpUnqNo":"00685935","fssCorpChgDtm":"2023/01/05","fstOpegDt":"20200509","lastOpegDt":"20230319"}]},"numOfRows":10,"pageNo":1,"totalCount":2},"header":{"resultCode":"00","resultMsg":"NORMAL SERVICE."}}}
```