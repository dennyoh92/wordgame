# Google Sheets Backend Setup Instructions

일일 클리어 보드를 위한 Google Sheets 백엔드 설정 가이드입니다.

## 1. Google Sheet 만들기
- [sheets.new](https://sheets.new)에서 새 시트 생성
- 첫 번째 탭 이름을 `clearboard`로 변경
- (선택) 헤더 추가: `Timestamp`, `DateID`, `PlayerID`, `TotalTime`

## 2. Apps Script 추가
- **Extensions** > **Apps Script** 클릭
- `Code.gs`의 기존 코드를 모두 지우고 아래 코드를 붙여넣기:

```javascript
/*
  숨바꼭질 - Google Sheets Backend
  일일 클리어 보드 관리 (클리어 시간 기록 + 조회)
  날짜별로 자동 리셋됩니다.
*/

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'clearBoard') {
      return handleClearBoardPost(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleClearBoardPost(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('clearboard');
  if (!sheet) {
    // 시트가 없으면 자동 생성
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet('clearboard');
    newSheet.appendRow(['Timestamp', 'DateID', 'PlayerID', 'TotalTime']);
  }
  
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('clearboard');
  
  // 같은 날짜 + 같은 플레이어의 기존 기록 확인
  const values = targetSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(data.dateId) && String(values[i][2]) === String(data.playerId)) {
      // 이미 기록이 있으면 더 빠른 시간으로 업데이트
      const existingTime = parseFloat(values[i][3]);
      const newTime = parseFloat(data.totalTime);
      if (newTime < existingTime) {
        targetSheet.getRange(i + 1, 4).setValue(newTime);
        targetSheet.getRange(i + 1, 1).setValue(new Date());
      }
      return ContentService.createTextOutput(JSON.stringify({ "result": "updated" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 새 기록 추가
  targetSheet.appendRow([
    new Date(),
    data.dateId,
    data.playerId,
    parseFloat(data.totalTime)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'clearBoard') {
      return handleClearBoardGet(e);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleClearBoardGet(e) {
  const dateId = e.parameter.dateId;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('clearboard');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ entries: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const values = sheet.getDataRange().getValues();
  const entries = [];
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === String(dateId)) {
      entries.push({
        playerId: values[i][2],
        totalTime: parseFloat(values[i][3])
      });
    }
  }
  
  // 시간순 정렬
  entries.sort((a, b) => a.totalTime - b.totalTime);
  
  return ContentService.createTextOutput(JSON.stringify({ entries: entries }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. 웹 앱으로 배포
- **Deploy** > **New Deployment** 클릭
- Type: **Web App** 선택
- Description: `숨바꼭질 Backend`
- Execute as: **Me**
- Who has access: **Anyone**
- **Deploy** 클릭
- **Web App URL 복사**

> ⚠️ 기존 배포를 업데이트하는 경우: **Deploy** > **Manage deployments** > 연필 아이콘 클릭 > Version을 **New version**으로 선택 > **Deploy**

## 4. index.html 업데이트
- `index.html`의 `GameEngine` constructor에서 `this.scriptUrl = "";` 부분에 Web App URL을 붙여넣기

## API 명세

### POST - 클리어 시간 기록
```json
{
  "action": "clearBoard",
  "dateId": "20260214",
  "playerId": "플레이어이름",
  "totalTime": 123.4
}
```
- 같은 날짜 + 같은 플레이어가 이미 있으면 더 빠른 시간으로만 업데이트

### GET - 클리어 보드 조회
```
?action=clearBoard&dateId=20260214
```
응답:
```json
{
  "entries": [
    { "playerId": "플레이어A", "totalTime": 85.3 },
    { "playerId": "플레이어B", "totalTime": 102.1 }
  ]
}
```
