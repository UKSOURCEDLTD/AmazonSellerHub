import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey, Numeric
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()

class Marketplace(Base):
    __tablename__ = "marketplaces"

    id = Column(String, primary_key=True)  # e.g., "ATVPDKIKX0DER" (US)
    name = Column(String, nullable=False)   # e.g., "Amazon.com"
    region = Column(String, nullable=False) # e.g., "North America"
    currency_code = Column(String, nullable=False) # e.g., "USD"

    # Relationships
    products = relationship("Product", back_populates="marketplace")

class SellerAccount(Base):
    __tablename__ = "seller_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False) # Internal name for the account
    sp_api_refresh_token = Column(String, nullable=True) # Encrypted in real app
    seller_id = Column(String, nullable=False) # Amazon Seller ID (Merchant Token)

    # Relationships
    transactions = relationship("Transaction", back_populates="seller_account")
    settlement_reports = relationship("SettlementReport", back_populates="seller_account")
    products = relationship("Product", back_populates="seller_account")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asin = Column(String, nullable=False, index=True)
    sku = Column(String, nullable=False, index=True)
    title = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    marketplace_id = Column(String, ForeignKey("marketplaces.id"), nullable=False)
    seller_account_id = Column(UUID(as_uuid=True), ForeignKey("seller_accounts.id"), nullable=False)

    # Relationships
    marketplace = relationship("Marketplace", back_populates="products")
    seller_account = relationship("SellerAccount", back_populates="products")
    costs = relationship("ProductCost", back_populates="product")
    transactions = relationship("Transaction", back_populates="product")

class ProductCost(Base):
    __tablename__ = "product_costs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    
    cogs = Column(Numeric(10, 2), nullable=False) # Cost of Goods Sold
    supplier_invoice_id = Column(String, nullable=True) # Reference to invoice
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True) # Null means current active cost

    # Relationships
    product = relationship("Product", back_populates="costs")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_account_id = Column(UUID(as_uuid=True), ForeignKey("seller_accounts.id"), nullable=False)
    
    posted_date = Column(DateTime, nullable=False)
    type = Column(String, nullable=False) # Order, Refund, ServiceFee, Adjustment
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False)
    amazon_order_id = Column(String, nullable=True, index=True)
    
    related_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    
    # Relationships
    seller_account = relationship("SellerAccount", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")

class SettlementReport(Base):
    __tablename__ = "settlement_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_account_id = Column(UUID(as_uuid=True), ForeignKey("seller_accounts.id"), nullable=False)
    
    report_id = Column(String, nullable=False, unique=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    deposit_date = Column(DateTime, nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    
    # Relationships
    seller_account = relationship("SellerAccount", back_populates="settlement_reports")
