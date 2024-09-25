enum ACTION_TYPE {
    SEND_SMS = 'SEND_SMS',
    SEND_EMAIL = 'SEND_EMAIL',
    CONDITION = 'CONDITION',
    LOOP = 'LOOP'
}

interface ActionHandler {
    execute(): void;
    serialize(): object;
}

interface TransferData {
    sender: string;
    receiver: string;
}

class Branch implements TransferData {
    type: ACTION_TYPE;
    branch: string = '';
    sender: string = '';
    receiver: string = '';
    constructor(data?: Branch) {
        if (data) {
            this.type = data.type;
            this.branch = data.branch;
            this.sender = data.sender;
            this.receiver = data.receiver;
        }
    }
}

type TreeModel = {
    type: ACTION_TYPE;
}

type ConditionTreeResponse = TreeModel & {
    type: ACTION_TYPE.CONDITION
    condition: string;
    branches: Branch[];
    defaultBranch: string;
}

type SMSTreeResponse = TreeModel & {
    type: ACTION_TYPE.SEND_SMS
    phoneNumber: string;
}

type EmailTreeResponse = TreeModel & 
                         TransferData & {
    type: ACTION_TYPE.SEND_EMAIL;
}

type LoopTreeResponse = TreeModel & {
    type: ACTION_TYPE.LOOP;
    iterations: number;
    subtree: object;
}

class SendSMSAction implements ActionHandler {
    constructor(private branch: string,
                private phoneNumber: string) {}

    execute(): void {
        console.log(`[${new Date().getTime()}] (From: ${this.branch}) SMS has been sent to: ${this.phoneNumber}`);
    }

    serialize(): SMSTreeResponse {
        return {
            type: ACTION_TYPE.SEND_SMS,
            phoneNumber: this.phoneNumber
        };
    }

    static deserialize(data: any): SendSMSAction {
        return new SendSMSAction(data.branch, data.phoneNumber);
    }
}


class SendEmailAction implements ActionHandler {
    constructor(private branch: string,
                private sender: string, 
                private receiver: string) {}

    execute() {
        console.log(`[${new Date().getTime()}] ${this.branch} (${this.sender}) sent email to ${this.receiver}!`);
    }

    serialize(): EmailTreeResponse {
        return {
            type: ACTION_TYPE.SEND_EMAIL,
            sender: this.sender,
            receiver: this.receiver
        };
    }

    static deserialize(data: Branch): SendEmailAction {
        return new SendEmailAction(data.branch, data.sender, data.receiver);
    }
}


class ConditionAction implements ActionHandler {
    constructor(
        private condition: string,
        private branches: ActionHandler[],
        private defaultBranch: string
    ) {}

    execute(): void {
        const result = eval(this.condition);

        if (result) {
            console.log(`Condition "${this.condition}" is true: Executing ${this.branches.length} branches`);
        } else {
            console.log(`Condition "${this.condition}" is false: Executing branch Sales`);
        }

        if (this.branches.length) {
            for (let branch of this.branches) {
                branch.execute();
            }
        } else if (this.defaultBranch) {
            console.log(`No branch matched, using ${this.defaultBranch}`);
        } else {
            console.error(`No branch found.`);
        }
    }

    serialize(): ConditionTreeResponse {
        return {
            type: ACTION_TYPE.CONDITION,
            condition: this.condition,
            branches: this.branches.map((b: ActionHandler & Branch) => new Branch({
                branch: b.branch,
                type: b.type,
                sender: b.sender,
                receiver: b.receiver
            })),
            defaultBranch: this.defaultBranch
        };
    }

    static deserialize(data: any): ConditionAction {
        const branches = data.branches.map((b: Branch) => ActionFactory.create(b));
        return new ConditionAction(data.condition, branches, data.defaultBranch);
    }
}


class LoopAction implements ActionHandler {
    constructor(private iterations: number, private subtree: ActionHandler) {}

    execute(): void {
        for (let i = 0; i < this.iterations; i++) {
            console.log(`Iteration # ${i + 1}/${this.iterations}`);
            this.subtree.execute();
        }
    }

    serialize(): LoopTreeResponse {
        return {
            type: ACTION_TYPE.LOOP,
            iterations: this.iterations,
            subtree: this.subtree.serialize()
        };
    }

    static deserialize(data: any): LoopAction {
        const subtree = ActionFactory.create(data.subtree);
        return new LoopAction(data.iterations, subtree);
    }
}


class ActionFactory {
    static create(data: any): ActionHandler {
        switch (data.type) {
            case ACTION_TYPE.SEND_SMS:
                return SendSMSAction.deserialize(data);
            case ACTION_TYPE.SEND_EMAIL:
                return SendEmailAction.deserialize(data);
            case ACTION_TYPE.CONDITION:
                return ConditionAction.deserialize(data);
            case ACTION_TYPE.LOOP:
                return LoopAction.deserialize(data);
            default:
                throw new Error(`An error occured, sent: ${data.type}`);
        }
    }
}


class DecisionTreeService {
    static executeTree(jsonTree: any): void {
        const rootAction = ActionFactory.create(jsonTree);
        rootAction.execute();
    }
}


// DATA EXAMPLES

const christmasTree = {
    type: ACTION_TYPE.CONDITION,
    condition: 'new Date().getFullYear() === 2025',
    branches: [
        {
            branch: 'Santa Claus',
            type: ACTION_TYPE.SEND_SMS,
            phoneNumber: '000000000'
        },
        {
            branch: 'Ice Queen',
            type: ACTION_TYPE.SEND_EMAIL,
            sender: 'sender@mail.com',
            receiver: 'receiver@mail.com'
        }
    ]
};

const conditionTreeSample = {
    type: ACTION_TYPE.CONDITION,
    condition: "new Date().getFullYear() === 2024",
    branches: [
        {
            branch: "Marketing",
            type: ACTION_TYPE.SEND_EMAIL,
            sender: "marketing@example.com",
            receiver: "client_marketing@example.com"
        },
        {
            branch: "Sales",
            type: ACTION_TYPE.SEND_EMAIL,
            sender: "sales@example.com",
            receiver: "client_sales@example.com"
        }
    ],
    defaultBranch: "Marketing"
}

const sendEmailAndSmsTree = {
    type: ACTION_TYPE.CONDITION,
    condition: true,
    branches: [
        {   branch: 'Marketing',
            type: ACTION_TYPE.SEND_EMAIL,
            sender: "marketing@example.com",
            receiver: "client_marketing@example.com"
        },
        {   branch: 'AWSCustomer',
            type: ACTION_TYPE.SEND_EMAIL,
            sender: "yourbusiness@business.com",
            receiver: "aws_customer@mail.com"
        },
        {
            branch: 'Netlify',
            type: ACTION_TYPE.SEND_SMS,
            phoneNumber: '000000000'
        },
        {
            branch: "THIRD_CUSTOMER",
            type: ACTION_TYPE.SEND_EMAIL,
            sender: "yourbusiness@business.com",
            receiver: "third_customer@mail.com"
        }
    ],
    defaultBranch: 'Marketing'
}

const tenOptionalMailsTree = {
    type: ACTION_TYPE.LOOP,
    iterations: 10,
    subtree: {
        type: ACTION_TYPE.CONDITION,
        condition: 'Math.random() > 0.5',
        branches: [
            {
                branch: 'Marketing',
                type: ACTION_TYPE.SEND_EMAIL,
                sender: "marketing@example.com",
                receiver: "client_marketing@example.com"
            },
            {
                branch: 'Sales',
                type: ACTION_TYPE.SEND_EMAIL,
                sender: "sales@example.com",
                receiver: "client_sales@example.com"
            }
        ],
    }
};

DecisionTreeService.executeTree(christmasTree);
