// FlowEditor.tsx 파일에 아래 코드를 추가하세요 (useNodesState 호출 위치에)

import { AppNode } from "./types/appNode";

export const initialNodes: AppNode[] = [
  {
    id: "table-1",
    type: "SchemaNode",
    focusable: true,
    position: { x: 50, y: 50 },
    data: {
      id: "table-1",
      logicalName: "사용자",
      physicalName: "USER_TB",
      color: "",
      columns: [
        {
          id: "col-1",
          logicalName: "사용자 아이디",
          physicalName: "user_id",
          dataType: "int",
          order: 0,
          constraints: {
            isPrimaryKey: true,
            isNotNull: true,
            isUnique: true,
          },
        },
        {
          id: "col-2",
          logicalName: "이름",
          physicalName: "name",
          dataType: "varchar",
          order: 1,
          typeOptions: {
            length: 100,
          },
          constraints: {
            isNotNull: true,
          },
        },
        {
          id: "col-3",
          logicalName: "이메일",
          physicalName: "email",
          dataType: "varchar",
          order: 2,
          typeOptions: {
            length: 255,
          },
          constraints: {
            isUnique: true,
            isNotNull: true,
          },
        },
        {
          id: "col-4",
          logicalName: "생성일시",
          physicalName: "created_at",
          dataType: "datetime",
          order: 3,
          constraints: {
            isNotNull: true,
            defaultValue: "CURRENT_TIMESTAMP",
          },
        },
      ],
      description: "서비스 사용자 정보를 저장하는 테이블",
    },
  },
];
