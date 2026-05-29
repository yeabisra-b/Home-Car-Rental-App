import { Sequelize } from 'sequelize';
import { User, initUser } from '../models/User';
import { Property, initProperty } from '../models/Property';
import { PropertyBuilding, initPropertyBuilding } from '../models/PropertyBuilding';
import { PropertyVehicle, initPropertyVehicle } from '../models/PropertyVehicle';
import { RentalUnit, initRentalUnit } from '../models/RentalUnit';
import { PropertyMedia, initPropertyMedia } from '../models/PropertyMedia';
import { Lease, initLease } from '../models/Lease';
import { LeaseDocument, initLeaseDocument } from '../models/LeaseDocument';
import { Invoice, initInvoice } from '../models/Invoice';
import { PaymentReceipt, initPaymentReceipt } from '../models/PaymentReceipt';
import { MaintenanceRequest, initMaintenanceRequest } from '../models/MaintenanceRequest';
import { MaintenanceEvidence, initMaintenanceEvidence } from '../models/MaintenanceEvidence';
import { Message, initMessage } from '../models/Message';
import { Announcement, initAnnouncement } from '../models/Announcement';
import { Notification, initNotification } from '../models/Notification';
import { Conversation, initConversation } from '../models/Conversation';
import { ActivityLog, initActivityLog } from '../models/ActivityLog';

export interface DatabaseModels {
  User: typeof User;
  Property: typeof Property;
  PropertyBuilding: typeof PropertyBuilding;
  PropertyVehicle: typeof PropertyVehicle;
  RentalUnit: typeof RentalUnit;
  PropertyMedia: typeof PropertyMedia;
  Lease: typeof Lease;
  LeaseDocument: typeof LeaseDocument;
  Invoice: typeof Invoice;
  PaymentReceipt: typeof PaymentReceipt;
  MaintenanceRequest: typeof MaintenanceRequest;
  MaintenanceEvidence: typeof MaintenanceEvidence;
  Message: typeof Message;
  Announcement: typeof Announcement;
  Notification: typeof Notification;
  Conversation: typeof Conversation;
  ActivityLog: typeof ActivityLog;
}

let associationsInitialized = false;

export function initializeModels(sequelize: Sequelize): DatabaseModels {
  const UserModel = sequelize.models.User as typeof User | undefined ?? initUser(sequelize);
  const PropertyModel = sequelize.models.Property as typeof Property | undefined ?? initProperty(sequelize);
  const PropertyBuildingModel =
    sequelize.models.PropertyBuilding as typeof PropertyBuilding | undefined ?? initPropertyBuilding(sequelize);
  const PropertyVehicleModel =
    sequelize.models.PropertyVehicle as typeof PropertyVehicle | undefined ?? initPropertyVehicle(sequelize);
  const RentalUnitModel =
    sequelize.models.RentalUnit as typeof RentalUnit | undefined ?? initRentalUnit(sequelize);
  const PropertyMediaModel =
    sequelize.models.PropertyMedia as typeof PropertyMedia | undefined ?? initPropertyMedia(sequelize);
  const LeaseModel = sequelize.models.Lease as typeof Lease | undefined ?? initLease(sequelize);
  const LeaseDocumentModel =
    sequelize.models.LeaseDocument as typeof LeaseDocument | undefined ?? initLeaseDocument(sequelize);
  const InvoiceModel = sequelize.models.Invoice as typeof Invoice | undefined ?? initInvoice(sequelize);
  const PaymentReceiptModel =
    sequelize.models.PaymentReceipt as typeof PaymentReceipt | undefined ?? initPaymentReceipt(sequelize);
  const MaintenanceRequestModel =
    sequelize.models.MaintenanceRequest as typeof MaintenanceRequest | undefined ?? initMaintenanceRequest(sequelize);
  const MaintenanceEvidenceModel =
    sequelize.models.MaintenanceEvidence as typeof MaintenanceEvidence | undefined ?? initMaintenanceEvidence(sequelize);
  const MessageModel = sequelize.models.Message as typeof Message | undefined ?? initMessage(sequelize);
  const AnnouncementModel =
    sequelize.models.Announcement as typeof Announcement | undefined ?? initAnnouncement(sequelize);
  const NotificationModel =
    sequelize.models.Notification as typeof Notification | undefined ?? initNotification(sequelize);
  const ConversationModel =
    sequelize.models.Conversation as typeof Conversation | undefined ?? initConversation(sequelize);
  const ActivityLogModel =
    sequelize.models.ActivityLog as typeof ActivityLog | undefined ?? initActivityLog(sequelize);

  if (!associationsInitialized) {
    UserModel.hasMany(PropertyModel, { foreignKey: 'ownerId', as: 'properties' });
    PropertyModel.belongsTo(UserModel, { foreignKey: 'ownerId', as: 'owner' });

    PropertyModel.hasOne(PropertyBuildingModel, { foreignKey: 'propertyId', as: 'buildingDetails' });
    PropertyBuildingModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    PropertyModel.hasOne(PropertyVehicleModel, { foreignKey: 'propertyId', as: 'vehicleDetails' });
    PropertyVehicleModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    PropertyModel.hasMany(RentalUnitModel, { foreignKey: 'propertyId', as: 'rentalUnits' });
    RentalUnitModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    UserModel.hasMany(LeaseModel, { foreignKey: 'tenantId', as: 'tenantLeases' });
    LeaseModel.belongsTo(UserModel, { foreignKey: 'tenantId', as: 'tenant' });

    RentalUnitModel.hasMany(LeaseModel, { foreignKey: 'unitId', as: 'leases' });
    RentalUnitModel.hasOne(LeaseModel, { foreignKey: 'unitId', as: 'currentLease' });
    LeaseModel.belongsTo(RentalUnitModel, { foreignKey: 'unitId', as: 'unit' });

    LeaseModel.hasMany(LeaseDocumentModel, { foreignKey: 'leaseId', as: 'documents' });
    LeaseDocumentModel.belongsTo(LeaseModel, { foreignKey: 'leaseId', as: 'lease' });

    LeaseModel.hasMany(InvoiceModel, { foreignKey: 'leaseId', as: 'invoices' });
    InvoiceModel.belongsTo(LeaseModel, { foreignKey: 'leaseId', as: 'lease' });

    InvoiceModel.hasMany(PaymentReceiptModel, { foreignKey: 'invoiceId', as: 'receipts' });
    PaymentReceiptModel.belongsTo(InvoiceModel, { foreignKey: 'invoiceId', as: 'invoice' });

    RentalUnitModel.hasMany(MaintenanceRequestModel, { foreignKey: 'unitId', as: 'maintenanceRequests' });
    MaintenanceRequestModel.belongsTo(RentalUnitModel, { foreignKey: 'unitId', as: 'unit' });

    UserModel.hasMany(MaintenanceRequestModel, { foreignKey: 'tenantId', as: 'maintenanceRequests' });
    MaintenanceRequestModel.belongsTo(UserModel, { foreignKey: 'tenantId', as: 'tenant' });

    UserModel.hasMany(MaintenanceRequestModel, { foreignKey: 'resolvedBy', as: 'resolvedMaintenanceRequests' });
    MaintenanceRequestModel.belongsTo(UserModel, { foreignKey: 'resolvedBy', as: 'resolver' });

    MaintenanceRequestModel.hasMany(MaintenanceEvidenceModel, { foreignKey: 'requestId', as: 'evidence' });
    MaintenanceEvidenceModel.belongsTo(MaintenanceRequestModel, { foreignKey: 'requestId', as: 'request' });

    PropertyModel.hasMany(PropertyMediaModel, { foreignKey: 'propertyId', as: 'media' });
    PropertyMediaModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    UserModel.hasMany(PropertyMediaModel, { foreignKey: 'uploadedBy', as: 'uploadedMedia' });
    PropertyMediaModel.belongsTo(UserModel, { foreignKey: 'uploadedBy', as: 'uploader' });

    UserModel.hasMany(LeaseDocumentModel, { foreignKey: 'uploadedBy', as: 'uploadedLeaseDocuments' });
    LeaseDocumentModel.belongsTo(UserModel, { foreignKey: 'uploadedBy', as: 'uploader' });

    UserModel.hasMany(InvoiceModel, { foreignKey: 'reviewedBy', as: 'reviewedInvoices' });
    InvoiceModel.belongsTo(UserModel, { foreignKey: 'reviewedBy', as: 'reviewer' });

    UserModel.hasMany(PaymentReceiptModel, { foreignKey: 'uploadedBy', as: 'uploadedPaymentReceipts' });
    PaymentReceiptModel.belongsTo(UserModel, { foreignKey: 'uploadedBy', as: 'uploader' });

    UserModel.hasMany(MaintenanceEvidenceModel, { foreignKey: 'uploadedBy', as: 'uploadedMaintenanceEvidence' });
    MaintenanceEvidenceModel.belongsTo(UserModel, { foreignKey: 'uploadedBy', as: 'uploader' });

    UserModel.hasMany(MessageModel, { foreignKey: 'senderId', as: 'sentMessages' });
    MessageModel.belongsTo(UserModel, { foreignKey: 'senderId', as: 'sender' });

    UserModel.hasMany(MessageModel, { foreignKey: 'receiverId', as: 'receivedMessages' });
    MessageModel.belongsTo(UserModel, { foreignKey: 'receiverId', as: 'receiver' });

    UserModel.hasMany(AnnouncementModel, { foreignKey: 'ownerId', as: 'announcements' });
    AnnouncementModel.belongsTo(UserModel, { foreignKey: 'ownerId', as: 'owner' });

    PropertyModel.hasMany(AnnouncementModel, { foreignKey: 'propertyId', as: 'announcements' });
    AnnouncementModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    UserModel.hasMany(NotificationModel, { foreignKey: 'userId', as: 'notifications' });
    NotificationModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

    UserModel.hasMany(ConversationModel, { foreignKey: 'participantAId', as: 'startedConversations' });
    ConversationModel.belongsTo(UserModel, { foreignKey: 'participantAId', as: 'participantA' });

    UserModel.hasMany(ConversationModel, { foreignKey: 'participantBId', as: 'receivedConversations' });
    ConversationModel.belongsTo(UserModel, { foreignKey: 'participantBId', as: 'participantB' });

    PropertyModel.hasMany(ConversationModel, { foreignKey: 'propertyId', as: 'conversations' });
    ConversationModel.belongsTo(PropertyModel, { foreignKey: 'propertyId', as: 'property' });

    ConversationModel.hasMany(MessageModel, { foreignKey: 'conversationId', as: 'messages' });
    MessageModel.belongsTo(ConversationModel, { foreignKey: 'conversationId', as: 'conversation' });

    ConversationModel.belongsTo(MessageModel, { foreignKey: 'lastMessageId', as: 'lastMessage' });

    UserModel.hasMany(ActivityLogModel, { foreignKey: 'userId', as: 'activities' });
    ActivityLogModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

    associationsInitialized = true;
  }

  return {
    User: UserModel,
    Property: PropertyModel,
    PropertyBuilding: PropertyBuildingModel,
    PropertyVehicle: PropertyVehicleModel,
    RentalUnit: RentalUnitModel,
    PropertyMedia: PropertyMediaModel,
    Lease: LeaseModel,
    LeaseDocument: LeaseDocumentModel,
    Invoice: InvoiceModel,
    PaymentReceipt: PaymentReceiptModel,
    MaintenanceRequest: MaintenanceRequestModel,
    MaintenanceEvidence: MaintenanceEvidenceModel,
    Message: MessageModel,
    Announcement: AnnouncementModel,
    Notification: NotificationModel,
    Conversation: ConversationModel,
    ActivityLog: ActivityLogModel,
  };
}
