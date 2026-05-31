from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BrandGuide(BaseModel):
    default_tone: Optional[str] = None
    core_messages: List[str] = Field(default_factory=list)
    required_phrases: List[str] = Field(default_factory=list)
    banned_phrases: List[str] = Field(default_factory=list)
    mandatory_disclaimer: Optional[str] = None


class ComplianceGuide(BaseModel):
    must_include: List[str] = Field(default_factory=list)
    must_avoid: List[str] = Field(default_factory=list)
    regulatory_notes: Optional[str] = None


class ChannelLimits(BaseModel):
    blog_max_chars: Optional[int] = None
    instagram_max_chars: Optional[int] = None
    facebook_max_chars: Optional[int] = None


class ProductInput(BaseModel):
    product_id: str
    name: Optional[str] = None
    indication: Optional[str] = None
    clinical_data_summary: Optional[str] = None
    adverse_reactions: List[str] = Field(default_factory=list)
    contraindications: List[str] = Field(default_factory=list)
    target_audience: Optional[str] = None
    extra_context: Optional[str] = None
    mandatory_safety_statement: Optional[str] = None


class MultichannelCopyRequest(BaseModel):
    brand_guide: BrandGuide
    compliance_guide: ComplianceGuide
    channel_selection: List[str]
    tone_mode: str
    channel_limits: ChannelLimits
    products: List[ProductInput]


class GenerateRequest(BaseModel):
    input: Dict[str, Any]
