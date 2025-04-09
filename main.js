const mockDatabase = {
    users: [
        {
            email: "user@spl.com",
            password: "Password123",
            name: "John Doe",
            cardcode: "CUST1001",
            company: "ABC Corporation"
        }
    ],
    orders: [
        {
            cardcode: "CUST1001",
            customerName: "ABC Corporation",
            salesPerson: "Jane Smith",
            salesOrder: "SO-2023-1001",
            invoiceNumber: "INV-2023-0456",
            invoiceDate: "2023-05-15",
            customerPO: "PO-ABC-789",
            partNumber: "SPL-5000",
            description: "Industrial Sensor",
            qty: 1,
            sellingPrice: 245.99,
            serialNumber: "SN-5000-789456"
        },
        {
            cardcode: "CUST1001",
            customerName: "ABC Corporation",
            salesPerson: "Jane Smith",
            salesOrder: "SO-2023-1002",
            invoiceNumber: "INV-2023-0457",
            invoiceDate: "2023-05-20",
            customerPO: "PO-ABC-790",
            partNumber: "SPL-7002",
            description: "Control Module",
            qty: 2,
            sellingPrice: 189.50,
            serialNumber: "SN-7002-123456"
        }
    ],
    returns: [
        {
            sapc: "SAPC-2023-0456",
            date: "2023-06-15",
            partNumber: "SPL-5000",
            qty: 1,
            reason: "Wrong part supplied",
            status: "approved"
        },
        {
            sapc: "SAPC-2023-0457",
            date: "2023-06-18",
            partNumber: "SPL-7002",
            qty: 2,
            reason: "Item faulty (DOA)",
            status: "pending"
        },
        {
            sapc: "SAPC-2023-0458",
            date: "2023-06-20",
            partNumber: "SPL-3001",
            qty: 1,
            reason: "Order cancelled",
            status: "rejected"
        }
    ]
};

let currentUser = null;
let conversationState = {
    currentStep: "welcome",
    returnData: {},
    isNegativeTone: false,
    negativeCount: 0
};

const loginModal = document.getElementById("loginModal");
const appContainer = document.getElementById("appContainer");
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const chatSection = document.getElementById("chatSection");
const dashboardSection = document.getElementById("dashboardSection");
const documentPreview = document.getElementById("documentPreview");
const documentContent = document.getElementById("documentContent");
const pageTitle = document.getElementById("pageTitle");
const userAvatar = document.getElementById("userAvatar");
const userName = document.getElementById("userName");

window.onload = function () {
    loginModal.style.display = "flex";
};

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const user = mockDatabase.users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        userAvatar.textContent = user.name.split(" ").map(n => n[0]).join("");
        userName.textContent = user.name;

        loginModal.style.display = "none";
        appContainer.style.display = "flex";

        addBotMessage("Hello! I'm the SPL Returns Assistant. How can I help you today?");
        addQuickReplies([
            "Start a new return",
            "Check status of existing return",
            "Get help with returns process"
        ]);
    } else {
        alert("Invalid email or password. Please try again.");
    }
});

function sendMessage() {
    const message = userInput.value.trim();
    if (message === "") return;

    addUserMessage(message);
    userInput.value = "";

    processUserMessage(message);
}

function addUserMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addBotMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot-message";
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addQuickReplies(replies) {
    const quickRepliesDiv = document.createElement("div");
    quickRepliesDiv.className = "quick-replies";

    replies.forEach(reply => {
        const button = document.createElement("div");
        button.className = "quick-reply";
        button.textContent = reply;
        button.onclick = function () {
            addUserMessage(reply);
            processUserMessage(reply);
        };
        quickRepliesDiv.appendChild(button);
    });

    chatMessages.appendChild(quickRepliesDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processUserMessage(message) {
    if (message.toLowerCase().includes("angry") || message.toLowerCase().includes("frustrated") ||
        message.toLowerCase().includes("upset") || message.toLowerCase().includes("not happy")) {
        conversationState.isNegativeTone = true;
        conversationState.negativeCount++;

        if (conversationState.negativeCount > 1) {
            addBotMessage("I'm sorry you're having difficulties. Let me connect you with a human representative who can help.");
            return;
        } else {
            addBotMessage("I'm sorry to hear you're frustrated. Let me see how I can help resolve this for you.");
        }
    }

    switch (conversationState.currentStep) {
        case "welcome":
            if (message.includes("new return") || message.includes("start a return")) {
                startNewReturn();
            } else if (message.includes("status") || message.includes("existing")) {
                checkExistingReturn();
            } else if (message.includes("help")) {
                provideHelp();
            } else {
                addBotMessage("I'm not sure I understand. Could you please choose one of these options?");
                addQuickReplies([
                    "Start a new return",
                    "Check status of existing return",
                    "Get help with returns process"
                ]);
            }
            break;

        case "select_return_reason":
            handleReturnReason(message);
            break;

        case "provide_order_info":
            handleOrderInfo(message);
            break;

        case "confirm_return":
            if (message.toLowerCase().includes("yes") || message.toLowerCase().includes("confirm")) {
                completeReturn();
            } else {
                addBotMessage("Okay, let's start over.");
                startNewReturn();
            }
            break;

        case "check_existing_return":
            handleExistingReturnCheck(message);
            break;

        default:
            addBotMessage("I'm not sure what you're asking. Could you please rephrase?");
    }
}

function startNewReturn() {
    conversationState.currentStep = "select_return_reason";
    conversationState.returnData = {};

    addBotMessage("Let's start a new return. First, please tell me the reason for the return:");
    addQuickReplies([
        "SPL supplied wrong part",
        "Wrong part in the box",
        "Item is faulty (DOA)",
        "I had to cancel the order",
        "We ordered the incorrect part"
    ]);
}

function handleReturnReason(message) {
    conversationState.returnData.reason = message;

    if (message.includes("wrong") || message.includes("faulty")) {
        conversationState.returnData.ourFault = true;
        conversationState.returnData.restockFee = 0;
    } else {
        conversationState.returnData.ourFault = false;
        conversationState.returnData.restockFee = 20;
    }

    conversationState.currentStep = "provide_order_info";

    addBotMessage(`Thank you. You selected: "${message}". Now, please provide one of these to help me find your order:`);
    addQuickReplies([
        "PO number",
        "Invoice number",
        "Order number",
        "Serial number"
    ]);
}

function handleOrderInfo(message) {
    if (message.includes("number") || message.includes("serial")) {
        addBotMessage("Please enter the value:");
        return;
    }

    const searchTerm = message.trim();
    let foundOrder = null;

    if (searchTerm.startsWith("PO-")) {
        foundOrder = mockDatabase.orders.find(o => o.customerPO === searchTerm);
    } else if (searchTerm.startsWith("INV-")) {
        foundOrder = mockDatabase.orders.find(o => o.invoiceNumber === searchTerm);
    } else if (searchTerm.startsWith("SO-")) {
        foundOrder = mockDatabase.orders.find(o => o.salesOrder === searchTerm);
    } else if (searchTerm.startsWith("SN-")) {
        foundOrder = mockDatabase.orders.find(o => o.serialNumber === searchTerm);
    }

    if (foundOrder) {
        conversationState.returnData.order = foundOrder;
        conversationState.currentStep = "confirm_return";

        addBotMessage(`I found this order:\n\n` +
            `Part Number: ${foundOrder.partNumber}\n` +
            `Description: ${foundOrder.description}\n` +
            `Quantity: ${foundOrder.qty}\n` +
            `Invoice Date: ${foundOrder.invoiceDate}\n\n` +
            `Reason for return: ${conversationState.returnData.reason}\n` +
            (conversationState.returnData.restockFee > 0 ?
                `Restock Fee: ${conversationState.returnData.restockFee}%\n\n` : "\n") +
            `Would you like to proceed with this return?`);

        addQuickReplies(["Yes, proceed", "No, cancel"]);
    } else {
        addBotMessage("I couldn't find an order with that information. Please try again or provide a different reference.");
    }
}

function completeReturn() {
    const sapc = `SAPC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    mockDatabase.returns.unshift({
        sapc: sapc,
        date: new Date().toISOString().split('T')[0],
        partNumber: conversationState.returnData.order.partNumber,
        qty: conversationState.returnData.order.qty,
        reason: conversationState.returnData.reason,
        status: "pending"
    });

    addBotMessage(`Your return has been processed successfully!\n\n` +
        `Your SAPC number is: ${sapc}\n\n` +
        `Next steps:\n` +
        `1. Print the return form\n` +
        `2. Pack the item securely\n` +
        `3. Include the return form in the package\n` +
        `4. Ship to the address on the form\n\n` +
        `Would you like to print your return form now?`);

    generateReturnForm(sapc);

    addQuickReplies(["Yes, print now", "No, I'll do it later"]);

    conversationState.currentStep = "welcome";
}

function generateReturnForm(sapc) {
    const order = conversationState.returnData.order;
    const returnData = conversationState.returnData;

    documentContent.innerHTML = `
        <h4 style="text-align: center; margin-bottom: 30px;">SPL Return Authorization Form</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div><strong>SAPC #:</strong> ${sapc}</div>
            <div><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong>Customer:</strong> ${currentUser.company}<br>
            <strong>Contact:</strong> ${currentUser.name}<br>
            <strong>Cardcode:</strong> ${currentUser.cardcode}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #f5f7fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Part #</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Qty</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Serial #</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.partNumber}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.description}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.serialNumber}</td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-bottom: 20px;">
            <strong>Reason for Return:</strong> ${returnData.reason}<br>
            ${returnData.restockFee > 0 ? `<strong>Restock Fee:</strong> ${returnData.restockFee}%` : ''}
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <strong>Return Instructions:</strong><br>
            1. Pack the item securely in its original packaging if possible<br>
            2. Include this form inside the package<br>
            3. Ship to: SPL Returns Dept, 123 Industrial Way, Anytown, ST 12345<br>
            4. Keep your tracking number for reference
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sapc}" alt="QR Code">
            <p>Scan this code for return tracking</p>
        </div>
    `;
}

function checkExistingReturn() {
    conversationState.currentStep = "check_existing_return";

    addBotMessage("To check the status of an existing return, please provide your SAPC number or the original order/invoice number.");
}

function handleExistingReturnCheck(message) {
    const searchTerm = message.trim();
    let foundReturn = null;

    if (searchTerm.startsWith("SAPC-")) {
        foundReturn = mockDatabase.returns.find(r => r.sapc === searchTerm);
    } else if (searchTerm.startsWith("INV-")) {
        const order = mockDatabase.orders.find(o => o.invoiceNumber === searchTerm);
        if (order) {
            foundReturn = mockDatabase.returns.find(r => r.partNumber === order.partNumber);
        }
    } else if (searchTerm.startsWith("PO-") || searchTerm.startsWith("SO-")) {
        const order = mockDatabase.orders.find(o => o.customerPO === searchTerm || o.salesOrder === searchTerm);
        if (order) {
            foundReturn = mockDatabase.returns.find(r => r.partNumber === order.partNumber);
        }
    }

    if (foundReturn) {
        let statusMessage = "";
        if (foundReturn.status === "approved") {
            statusMessage = "Your return has been approved. We've processed your ";
            statusMessage += conversationState.returnData?.restockFee > 0 ?
                "restocking fee." : "replacement or credit.";
        } else if (foundReturn.status === "pending") {
            statusMessage = "Your return is currently being processed. We'll notify you once it's approved.";
        } else {
            statusMessage = "Your return was not approved. Please contact customer service for more information.";
        }

        addBotMessage(`Return Status for ${foundReturn.sapc}:\n\n` +
            `Part Number: ${foundReturn.partNumber}\n` +
            `Quantity: ${foundReturn.qty}\n` +
            `Date Submitted: ${foundReturn.date}\n` +
            `Status: ${foundReturn.status.charAt(0).toUpperCase() + foundReturn.status.slice(1)}\n\n` +
            statusMessage);
    } else {
        addBotMessage("I couldn't find a return with that reference. Please check and try again.");
    }

    conversationState.currentStep = "welcome";
    addQuickReplies([
        "Start a new return",
        "Check another return",
        "Get help with returns process"
    ]);
}

function provideHelp() {
    addBotMessage("Here's some information about our returns process:\n\n" +
        "• Returns must be initiated within 30 days of invoice for most reasons\n" +
        "• Faulty items can be returned within 1 year (warranty period)\n" +
        "• Restocking fees may apply for customer-cancelled orders\n" +
        "• Original packaging is preferred but not always required\n\n" +
        "Would you like to start a return now or check an existing one?");

    addQuickReplies([
        "Start a new return",
        "Check status of existing return",
        "I have another question"
    ]);
}

function showSection(section) {
    if (section === "chat") {
        chatSection.style.display = "flex";
        dashboardSection.style.display = "none";
        documentPreview.style.display = "none";
        pageTitle.textContent = "Returns Assistant";

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });
        document.querySelectorAll(".nav-item")[0].classList.add("active");
    } else if (section === "dashboard") {
        chatSection.style.display = "none";
        dashboardSection.style.display = "block";
        documentPreview.style.display = "none";
        pageTitle.textContent = "My Returns";

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });
        document.querySelectorAll(".nav-item")[1].classList.add("active");
    }
}

function printDocument() {
    window.print();
}

function downloadDocument() {
    alert("In a real implementation, this would download the return form as a PDF.");
}

userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});