const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());



const AWID = "shoppinglist-main";
const DEMO_OWNER_ID = "6770b0cd123456789000001";
const DEMO_LIST_ID = "6770b0cd123456789000010";
const DEMO_MEMBER_ID_1 = "6770b0cd123456789000002";
const DEMO_MEMBER_ID_2 = "6770b0cd123456789000003";

const DEMO_LIST_CREATED_AT = "2025-11-15T12:05:00Z";

const DEMO_ITEM_ID = "6770b5f2b4e72a9cbbbbbbb1";
const DEMO_ITEM_CREATED_AT = "2025-11-14T15:30:00Z";

//Helpers

function buildErrorResponse(code, message, paramMap = {}, status = 400) {
  return {
    status,
    body: {
      uuAppErrorMap: {
        [code]: {
          type: status === 400 ? "warning" : "error",
          message,
          paramMap
        }
      }
    }
  };
}

// kdybych někde chtěl dynamické datum
function nowIso() {
  return new Date().toISOString();
}

// ----------------- Authentication -----------------

// Pro tento úkol simulujeme autentizaci přes headers

// x-user-id: <userId>
// x-user-profiles: "User" or "User,Authorities"
function authenticate(req, res, next) {
  const userId = req.header("x-user-id");
  const profilesHeader = req.header("x-user-profiles");

  if (!userId || !profilesHeader) {
    const err = buildErrorResponse(
      "system/notAuthenticated",
      "User is not authenticated. Provide x-user-id and x-user-profiles headers.",
      {},
      401
    );
    return res.status(err.status).json(err.body);
  }

  req.user = {
    id: userId,
    profiles: profilesHeader.split(",").map((p) => p.trim())
  };

  next();
}

// ----------------- Authorization -----------------

function authorize(requiredProfiles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      const err = buildErrorResponse(
        "system/notAuthenticated",
        "User is not authenticated.",
        {},
        401
      );
      return res.status(err.status).json(err.body);
    }

    const hasProfile = user.profiles.some((p) => requiredProfiles.includes(p));
    if (!hasProfile) {
      const err = buildErrorResponse(
        "system/notAuthorized",
        "User is not authorized to call this uuCmd.",
        { requiredProfiles },
        403
      );
      return res.status(err.status).json(err.body);
    }

    next();
  };
}

app.use(authenticate);

// ----------------- API Endpoints -----------------
// 1) shoppingList/create
app.post(
  "/shoppingList/create",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (!dtoIn.name || typeof dtoIn.name !== "string") {
      const err = buildErrorResponse(
        "shoppingList/create/invalidDtoIn",
        "DtoIn is not valid. 'name' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const members = Array.isArray(dtoIn.members)
      ? dtoIn.members
      : [DEMO_MEMBER_ID_1, DEMO_MEMBER_ID_2];

    const dtoOut = {
      awid: AWID,
      id: DEMO_LIST_ID,
      ownerId: DEMO_OWNER_ID,
      name: dtoIn.name,
      members,
      isArchived: false,
      createdAt: DEMO_LIST_CREATED_AT,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 2) shoppingList/get
app.get(
  "/shoppingList/get",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.query || {};

    if (!dtoIn.id || typeof dtoIn.id !== "string") {
      const err = buildErrorResponse(
        "shoppingList/get/invalidDtoIn",
        "DtoIn is not valid. 'id' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: DEMO_LIST_ID,
      ownerId: DEMO_OWNER_ID,
      name: "BBQ party",
      members: [DEMO_MEMBER_ID_1, DEMO_MEMBER_ID_2],
      isArchived: false,
      createdAt: DEMO_LIST_CREATED_AT,
      items: [
        {
          id: DEMO_ITEM_ID,
          listId: DEMO_LIST_ID,
          name: "Milk",
          quantity: 2,
          status: "open",
          createdBy: DEMO_OWNER_ID,
          completedBy: null,
          createdAt: DEMO_ITEM_CREATED_AT
        }
      ],
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 3) shoppingList/list
app.get(
  "/shoppingList/list",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoOut = {
      awid: AWID,
      itemList: [
        {
          id: DEMO_LIST_ID,
          ownerId: DEMO_OWNER_ID,
          name: "BBQ party",
          members: [DEMO_MEMBER_ID_1, DEMO_MEMBER_ID_2],
          isArchived: false,
          createdAt: DEMO_LIST_CREATED_AT
        }
      ],
      pageInfo: {
        pageIndex: 0,
        pageSize: 50,
        total: 1
      },
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 4) shoppingList/delete
app.delete(
  "/shoppingList/delete",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (!dtoIn.id || typeof dtoIn.id !== "string") {
      const err = buildErrorResponse(
        "shoppingList/delete/invalidDtoIn",
        "DtoIn is not valid. 'id' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: dtoIn.id, // typicky DEMO_LIST_ID
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 5) shoppingList/addMember
app.post(
  "/shoppingList/addMember",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (
      !dtoIn.listId || typeof dtoIn.listId !== "string" ||
      !dtoIn.memberId || typeof dtoIn.memberId !== "string"
    ) {
      const err = buildErrorResponse(
        "shoppingList/addMember/invalidDtoIn",
        "DtoIn is not valid. 'listId' and 'memberId' are required and must be strings.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: DEMO_LIST_ID,
      ownerId: DEMO_OWNER_ID,
      name: "BBQ party",
      members: [DEMO_MEMBER_ID_1, DEMO_MEMBER_ID_2],
      isArchived: false,
      createdAt: DEMO_LIST_CREATED_AT,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 6) shoppingList/removeMember
app.post(
  "/shoppingList/removeMember",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (
      !dtoIn.listId || typeof dtoIn.listId !== "string" ||
      !dtoIn.memberId || typeof dtoIn.memberId !== "string"
    ) {
      const err = buildErrorResponse(
        "shoppingList/removeMember/invalidDtoIn",
        "DtoIn is not valid. 'listId' and 'memberId' are required and must be strings.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: DEMO_LIST_ID,
      members: [DEMO_MEMBER_ID_2],
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 7) item/add
app.post(
  "/item/add",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (
      !dtoIn.listId || typeof dtoIn.listId !== "string" ||
      !dtoIn.name || typeof dtoIn.name !== "string"
    ) {
      const err = buildErrorResponse(
        "item/add/invalidDtoIn",
        "DtoIn is not valid. 'listId' and 'name' are required and must be strings.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const quantity = dtoIn.quantity != null ? Number(dtoIn.quantity) : 2;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      const err = buildErrorResponse(
        "item/add/invalidDtoIn",
        "'quantity' must be a positive integer when provided.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: DEMO_ITEM_ID,
      listId: DEMO_LIST_ID,
      name: "Milk",
      quantity: 2,
      status: "open",
      createdBy: DEMO_OWNER_ID,
      completedBy: null,
      createdAt: DEMO_ITEM_CREATED_AT,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 8) item/update
app.post(
  "/item/update",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (!dtoIn.id || typeof dtoIn.id !== "string") {
      const err = buildErrorResponse(
        "item/update/invalidDtoIn",
        "DtoIn is not valid. 'id' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    if (dtoIn.quantity != null) {
      const q = Number(dtoIn.quantity);
      if (!Number.isInteger(q) || q <= 0) {
        const err = buildErrorResponse(
          "item/update/invalidDtoIn",
          "'quantity' must be a positive integer when provided.",
          { dtoIn }
        );
        return res.status(err.status).json(err.body);
      }
    }

    const dtoOut = {
      awid: AWID,
      id: DEMO_ITEM_ID,
      listId: DEMO_LIST_ID,
      name: "Whole milk",
      quantity: 3,
      status: "open",
      createdBy: DEMO_OWNER_ID,
      completedBy: null,
      createdAt: DEMO_ITEM_CREATED_AT,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 9) item/delete
app.delete(
  "/item/delete",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (!dtoIn.id || typeof dtoIn.id !== "string") {
      const err = buildErrorResponse(
        "item/delete/invalidDtoIn",
        "DtoIn is not valid. 'id' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    const dtoOut = {
      awid: AWID,
      id: dtoIn.id,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// 10) item/markComplete
app.post(
  "/item/markComplete",
  authorize(["User", "Authorities"]),
  (req, res) => {
    const dtoIn = req.body || {};

    if (!dtoIn.id || typeof dtoIn.id !== "string") {
      const err = buildErrorResponse(
        "item/markComplete/invalidDtoIn",
        "DtoIn is not valid. 'id' is required and must be a string.",
        { dtoIn }
      );
      return res.status(err.status).json(err.body);
    }

    //pokud completed !== false, beru to jako dokončené
    const completed = dtoIn.completed !== false;

    const dtoOut = {
      awid: AWID,
      id: DEMO_ITEM_ID,
      listId: DEMO_LIST_ID,
      name: "Milk",
      quantity: 2,
      status: completed ? "completed" : "open",
      createdBy: DEMO_OWNER_ID,
      completedBy: completed ? DEMO_OWNER_ID : null,
      createdAt: DEMO_ITEM_CREATED_AT,
      uuAppErrorMap: {}
    };

    res.json(dtoOut);
  }
);

// ----------------- Start server -----------------

app.listen(port, () => {
  console.log(`ShoppingList API listening on port ${port}`);
});
