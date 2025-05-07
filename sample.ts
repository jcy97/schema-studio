// FlowEditor.tsx
import {
  AppNode,
  Relationship,
  RelationshipType,
  RelationshipEdge,
} from "./types/appNode";

// 초기 노드(테이블) 정의
export const initialNodes: AppNode[] = [
  // 사용자 테이블
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

  // 주문 테이블
  {
    id: "table-2",
    type: "SchemaNode",
    focusable: true,
    position: { x: 400, y: 50 },
    data: {
      id: "table-2",
      logicalName: "주문",
      physicalName: "ORDER_TB",
      color: "",
      columns: [
        {
          id: "col-5",
          logicalName: "주문 아이디",
          physicalName: "order_id",
          dataType: "int",
          order: 0,
          constraints: {
            isPrimaryKey: true,
            isNotNull: true,
            isUnique: true,
          },
        },
        {
          id: "col-6",
          logicalName: "사용자 아이디",
          physicalName: "user_id",
          dataType: "int",
          order: 1,
          constraints: {
            isNotNull: true,
            foreignKey: {
              tableId: "table-1",
              columnId: "col-1",
            },
          },
        },
        {
          id: "col-7",
          logicalName: "주문금액",
          physicalName: "amount",
          dataType: "decimal",
          order: 2,
          typeOptions: {
            precision: 10,
            scale: 2,
          },
          constraints: {
            isNotNull: true,
          },
        },
        {
          id: "col-8",
          logicalName: "주문일시",
          physicalName: "order_date",
          dataType: "datetime",
          order: 3,
          constraints: {
            isNotNull: true,
            defaultValue: "CURRENT_TIMESTAMP",
          },
        },
      ],
      description: "사용자 주문 정보를 저장하는 테이블",
    },
  },

  // 상품 테이블
  {
    id: "table-3",
    type: "SchemaNode",
    focusable: true,
    position: { x: 400, y: 300 },
    data: {
      id: "table-3",
      logicalName: "상품",
      physicalName: "PRODUCT_TB",
      color: "",
      columns: [
        {
          id: "col-9",
          logicalName: "상품 아이디",
          physicalName: "product_id",
          dataType: "int",
          order: 0,
          constraints: {
            isPrimaryKey: true,
            isNotNull: true,
            isUnique: true,
          },
        },
        {
          id: "col-10",
          logicalName: "상품명",
          physicalName: "name",
          dataType: "varchar",
          order: 1,
          typeOptions: {
            length: 200,
          },
          constraints: {
            isNotNull: true,
          },
        },
        {
          id: "col-11",
          logicalName: "가격",
          physicalName: "price",
          dataType: "decimal",
          order: 2,
          typeOptions: {
            precision: 10,
            scale: 2,
          },
          constraints: {
            isNotNull: true,
          },
        },
      ],
      description: "판매 상품 정보를 저장하는 테이블",
    },
  },

  // 주문-상품 연결 테이블 (N:M 관계)
  {
    id: "table-4",
    type: "SchemaNode",
    focusable: true,
    position: { x: 750, y: 150 },
    data: {
      id: "table-4",
      logicalName: "주문상품",
      physicalName: "ORDER_PRODUCT_TB",
      color: "",
      columns: [
        {
          id: "col-12",
          logicalName: "주문 아이디",
          physicalName: "order_id",
          dataType: "int",
          order: 0,
          constraints: {
            isPrimaryKey: true,
            isNotNull: true,
            foreignKey: {
              tableId: "table-2",
              columnId: "col-5",
            },
          },
        },
        {
          id: "col-13",
          logicalName: "상품 아이디",
          physicalName: "product_id",
          dataType: "int",
          order: 1,
          constraints: {
            isPrimaryKey: true,
            isNotNull: true,
            foreignKey: {
              tableId: "table-3",
              columnId: "col-9",
            },
          },
        },
        {
          id: "col-14",
          logicalName: "수량",
          physicalName: "quantity",
          dataType: "int",
          order: 2,
          constraints: {
            isNotNull: true,
          },
        },
      ],
      description: "주문과 상품의 N:M 관계를 연결하는 테이블",
    },
  },
];

// 테이블 간 관계 정의
export const initialRelationships: Relationship[] = [
  // 사용자-주문 (1:N) 관계
  {
    id: "rel-1",
    name: "사용자-주문",
    type: RelationshipType.ONE_TO_MANY,
    sourceTableId: "table-1", // 사용자 테이블 (1쪽)
    sourceColumnIds: ["col-1"], // user_id (PK)
    targetTableId: "table-2", // 주문 테이블 (N쪽)
    targetColumnIds: ["col-6"], // user_id (FK)
    onDelete: "CASCADE",
    description: "한 사용자가 여러 주문을 가질 수 있음",
  },

  // 주문-주문상품 (1:N) 관계
  {
    id: "rel-2",
    name: "주문-주문상품",
    type: RelationshipType.ONE_TO_MANY,
    sourceTableId: "table-2", // 주문 테이블 (1쪽)
    sourceColumnIds: ["col-5"], // order_id (PK)
    targetTableId: "table-4", // 주문상품 테이블 (N쪽)
    targetColumnIds: ["col-12"], // order_id (FK)
    onDelete: "CASCADE",
    description: "한 주문이 여러 주문상품을 가질 수 있음",
  },

  // 상품-주문상품 (1:N) 관계
  {
    id: "rel-3",
    name: "상품-주문상품",
    type: RelationshipType.ONE_TO_MANY,
    sourceTableId: "table-3", // 상품 테이블 (1쪽)
    sourceColumnIds: ["col-9"], // product_id (PK)
    targetTableId: "table-4", // 주문상품 테이블 (N쪽)
    targetColumnIds: ["col-13"], // product_id (FK)
    onDelete: "RESTRICT",
    description: "한 상품이 여러 주문상품에 포함될 수 있음",
  },

  // 주문-상품 (N:M) 관계 (주문상품 테이블을 통한)
  {
    id: "rel-4",
    name: "주문-상품",
    type: RelationshipType.MANY_TO_MANY,
    sourceTableId: "table-2", // 주문 테이블
    sourceColumnIds: ["col-5"], // order_id
    targetTableId: "table-3", // 상품 테이블
    targetColumnIds: ["col-9"], // product_id
    junctionTable: {
      tableId: "table-4", // 주문상품 테이블 (N:M 연결 테이블)
      sourceColumnIds: ["col-12"], // order_id
      targetColumnIds: ["col-13"], // product_id
    },
    description:
      "주문과 상품의 N:M 관계 (한 주문에 여러 상품, 한 상품이 여러 주문에 포함)",
  },
];

// React Flow 엣지 데이터로 변환
export const initialEdges: RelationshipEdge[] = initialRelationships.map(
  (rel) => ({
    id: rel.id,
    source: rel.sourceTableId,
    target:
      rel.type === RelationshipType.MANY_TO_MANY
        ? rel.junctionTable!.tableId
        : rel.targetTableId,
    type: "deletableEdge", // 사용자 정의 엣지 타입
    data: {
      relationship: rel,
    },
  })
);

// N:M 관계의 두 번째 엣지 추가 (중간 테이블에서 타겟 테이블로)
initialRelationships.forEach((rel) => {
  if (rel.type === RelationshipType.MANY_TO_MANY) {
    initialEdges.push({
      id: `${rel.id}-2`,
      source: rel.junctionTable!.tableId,
      target: rel.targetTableId,
      type: "deletableEdge",
      data: {
        relationship: {
          ...rel,
          id: `${rel.id}-2`,
          name: `${rel.name}-2`,
          sourceTableId: rel.junctionTable!.tableId,
          sourceColumnIds: rel.junctionTable!.targetColumnIds,
        },
      },
    });
  }
});
